import hashlib
import hmac
import logging
from decimal import Decimal

import razorpay
from django.conf import settings
from django.db.models import Prefetch
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.cart.models import Cart
from apps.products.models import ProductImage
from apps.users.models import Address
from .models import Order, OrderItem, OrderStatusHistory, PaymentHistory
from .serializers import (
    CreateOrderSerializer,
    OrderDetailSerializer,
    OrderListSerializer,
    PaymentHistorySerializer,
)
from .throttles import OrderCreateRateThrottle, PaymentVerifyRateThrottle

logger = logging.getLogger('apps.orders')


def _order_items_prefetch():
    """Prefetch spec for order items with all nested relations."""
    from apps.products.models import ProductVariant
    return Prefetch(
        'items',
        queryset=OrderItem.objects.select_related(
            'variant__product__category',
        ).prefetch_related(
            Prefetch(
                'variant__product__images',
                queryset=ProductImage.objects.order_by('display_order'),
            )
        )
    )


def api_response(data=None, message='Success', success=True, status_code=status.HTTP_200_OK):
    return Response({'success': success, 'data': data, 'message': message}, status=status_code)


def api_error(error='An error occurred', details=None, status_code=status.HTTP_400_BAD_REQUEST):
    return Response({'success': False, 'error': error, 'details': details or {}}, status=status_code)


def get_razorpay_client():
    return razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))


def fulfill_paid_order(order, razorpay_payment_id=None):
    """
    Mark a paid order as payment received exactly once.

    Both the frontend verification endpoint and Razorpay webhooks can report a
    successful payment. Stock and cart cleanup must therefore be idempotent.
    """
    if razorpay_payment_id and order.razorpay_payment_id != razorpay_payment_id:
        order.razorpay_payment_id = razorpay_payment_id

    if order.status not in ('payment_not_received', 'payment_failed'):
        if razorpay_payment_id:
            order.save()
        return False

    order.status = 'payment_received'
    order.save()

    for item in order.items.select_related('variant').all():
        variant = item.variant
        if variant:
            variant.stock -= item.quantity
            variant.save()

    try:
        cart = Cart.objects.get(user=order.user)
        cart.items.all().delete()
    except Cart.DoesNotExist:
        pass

    return True


class CreateOrderView(APIView):
    """POST /api/orders/create/ — Create order from cart, initiate Razorpay payment."""
    permission_classes = [IsAuthenticated]
    throttle_classes = [OrderCreateRateThrottle]

    def post(self, request):
        serializer = CreateOrderSerializer(data=request.data)
        if not serializer.is_valid():
            return api_error('Validation failed', serializer.errors)

        user = request.user
        address = get_object_or_404(Address, pk=serializer.validated_data['address_id'], user=user)

        # ── Idempotency guard ────────────────────────────────────────────────
        # If the user already has a pending order (payment_not_received) created
        # within the last 30 seconds, return it instead of creating a duplicate.
        # This is the server-side safety net against double-clicks, network
        # retries, and any other re-submissions that bypass the frontend lock.
        idempotency_window = timezone.now() - timezone.timedelta(seconds=30)
        recent_pending = Order.objects.filter(
            user=user,
            status='payment_not_received',
            created_at__gte=idempotency_window,
        ).order_by('-created_at').first()

        if recent_pending and recent_pending.razorpay_order_id:
            logger.info(
                f'Idempotency: returning existing order {recent_pending.id} '
                f'for user {user.id} instead of creating duplicate.'
            )
            return api_response({
                'order_id': str(recent_pending.id),
                'razorpay_order_id': recent_pending.razorpay_order_id,
                'amount': float(recent_pending.total_amount),
                'currency': 'INR',
                'key_id': settings.RAZORPAY_KEY_ID,
                'user': {
                    'name': user.name,
                    'email': user.email,
                    'phone': user.phone,
                }
            }, 'Existing pending order returned', status_code=status.HTTP_200_OK)
        # ── End idempotency guard ────────────────────────────────────────────

        # Get user's cart
        try:
            cart = Cart.objects.get(user=user)
        except Cart.DoesNotExist:
            return api_error('Cart is empty')

        cart_items = cart.items.select_related('variant__product').all()
        if not cart_items.exists():
            return api_error('Cart is empty')

        # Validate stock
        for item in cart_items:
            if item.variant.stock < item.quantity:
                return api_error(
                    f'{item.variant.product.name} ({item.variant.metal_type}) has only '
                    f'{item.variant.stock} items in stock'
                )


        # Calculate subtotal
        subtotal = sum(item.variant.price * item.quantity for item in cart_items)

        # Apply discount if provided
        discount_amount = Decimal('0.00')
        discount_code = serializer.validated_data.get('discount_code', '').strip()
        if discount_code:
            from apps.products.models import Product  # avoid circular
            try:
                from django.utils import timezone as tz
                from django.db.models import Q

                # Import Discount model - we'll create it inline since it's referenced in the schema
                # For now, discount logic is optional and can be extended
                pass
            except Exception:
                pass

        payment_method = serializer.validated_data.get('payment_method', 'razorpay')

        # BUSINESS RULE: Shipping is ALWAYS free unless COD
        if payment_method == 'COD':
            shipping_charge = Decimal('99.00')
            initial_status = 'payment_not_received'
        else:
            shipping_charge = Decimal('0.00')
            initial_status = 'payment_not_received'

        total_amount = subtotal - discount_amount + shipping_charge

        # Create order
        order = Order.objects.create(
            user=user,
            address=address,
            status=initial_status,
            subtotal_amount=subtotal,
            shipping_charge=shipping_charge,
            discount_amount=discount_amount,
            total_amount=total_amount,
        )

        # Create order items with price snapshot
        for item in cart_items:
            OrderItem.objects.create(
                order=order,
                variant=item.variant,
                quantity=item.quantity,
                price_at_purchase=item.variant.price,
            )

        # Order history and logging flows are now natively fired upon .save()

        if payment_method == 'COD':
            # Update status to trigger email after items are created
            order.status = 'preparing'
            order.save()

            # Deduct stock and clear cart immediately
            for item in cart_items:
                if item.variant:
                    item.variant.stock -= item.quantity
                    item.variant.save()
            try:
                cart.items.all().delete()
            except Exception:
                pass
            
            return api_response({
                'order_id': str(order.id),
                'amount': float(total_amount),
                'currency': 'INR',
                'payment_method': 'COD'
            }, 'Order created successfully', status_code=status.HTTP_201_CREATED)

        # Create Razorpay order
        try:
            client = get_razorpay_client()
            razorpay_order = client.order.create({
                'amount': int(total_amount * 100),  # Amount in paise
                'currency': 'INR',
                'receipt': str(order.id),
                'notes': {
                    'order_id': str(order.id),
                    'user_email': user.email,
                }
            })

            order.razorpay_order_id = razorpay_order['id']
            order.save()

            # Create PaymentHistory record
            PaymentHistory.objects.create(
                order=order,
                user=user,
                razorpay_order_id=razorpay_order['id'],
                amount=total_amount,
                status='initiated',
            )

        except Exception as e:
            logger.error(f'Razorpay order creation failed: {e}')
            order.delete()
            return api_error('Payment gateway error. Please try again.',
                             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return api_response({
            'order_id': str(order.id),
            'razorpay_order_id': razorpay_order['id'],
            'amount': float(total_amount),
            'currency': 'INR',
            'key_id': settings.RAZORPAY_KEY_ID,
            'user': {
                'name': user.name,
                'email': user.email,
                'phone': user.phone,
            }
        }, 'Order created', status_code=status.HTTP_201_CREATED)


class VerifyPaymentView(APIView):
    """POST /api/orders/verify-payment/ — Verify Razorpay payment signature."""
    permission_classes = [IsAuthenticated]
    throttle_classes = [PaymentVerifyRateThrottle]

    def post(self, request):
        razorpay_order_id = request.data.get('razorpay_order_id')
        razorpay_payment_id = request.data.get('razorpay_payment_id')
        razorpay_signature = request.data.get('razorpay_signature')

        if not all([razorpay_order_id, razorpay_payment_id, razorpay_signature]):
            return api_error('Missing payment verification data')

        # Verify signature
        try:
            client = get_razorpay_client()
            client.utility.verify_payment_signature({
                'razorpay_order_id': razorpay_order_id,
                'razorpay_payment_id': razorpay_payment_id,
                'razorpay_signature': razorpay_signature,
            })
        except razorpay.errors.SignatureVerificationError:
            # Update payment history
            PaymentHistory.objects.filter(
                razorpay_order_id=razorpay_order_id
            ).update(
                status='failed',
                failure_reason='Signature verification failed',
                completed_at=timezone.now(),
            )
            return api_error('Payment verification failed', status_code=status.HTTP_400_BAD_REQUEST)

        # Payment verified — update order
        try:
            order = Order.objects.get(razorpay_order_id=razorpay_order_id, user=request.user)
        except Order.DoesNotExist:
            return api_error('Order not found', status_code=status.HTTP_404_NOT_FOUND)

        # Update payment history
        payment = PaymentHistory.objects.filter(
            razorpay_order_id=razorpay_order_id,
            razorpay_payment_id=razorpay_payment_id
        ).first()

        if not payment:
            payment = PaymentHistory.objects.filter(
                razorpay_order_id=razorpay_order_id,
                status='initiated'
            ).first()

        if not payment:
            payment = PaymentHistory(
                order=order,
                user=request.user,
                razorpay_order_id=razorpay_order_id,
                amount=order.total_amount,
            )

        payment.razorpay_payment_id = razorpay_payment_id
        payment.razorpay_signature = razorpay_signature
        payment.status = 'success'
        payment.completed_at = timezone.now()
        # Fetch payment details from Razorpay
        try:
            payment_detail = client.payment.fetch(razorpay_payment_id)
            payment.payment_method = payment_detail.get('method', '')
            payment.gateway_response = payment_detail
        except Exception:
            pass
        payment.save()

        fulfill_paid_order(order, razorpay_payment_id)

        return api_response(
            OrderDetailSerializer(order).data,
            'Payment verified and order marked as received'
        )


class PaymentFailedView(APIView):
    """POST /api/orders/payment-failed/ - Mark a Razorpay payment attempt as failed."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        razorpay_order_id = request.data.get('razorpay_order_id')
        razorpay_payment_id = request.data.get('razorpay_payment_id')
        error = request.data.get('error_description') or request.data.get('error_reason') or 'Payment failed'

        if not razorpay_order_id:
            return api_error('Missing Razorpay order id')

        order = get_object_or_404(
            Order,
            razorpay_order_id=razorpay_order_id,
            user=request.user,
        )

        payment = PaymentHistory.objects.filter(
            razorpay_order_id=razorpay_order_id,
            razorpay_payment_id=razorpay_payment_id
        ).first()

        if not payment:
            payment = PaymentHistory.objects.filter(
                razorpay_order_id=razorpay_order_id,
                status='initiated'
            ).first()

        if not payment:
            payment = PaymentHistory(
                order=order,
                user=request.user,
                razorpay_order_id=razorpay_order_id,
                amount=order.total_amount,
            )

        payment.status = 'failed'
        payment.razorpay_payment_id = razorpay_payment_id or payment.razorpay_payment_id
        payment.failure_reason = error
        payment.gateway_response = request.data
        payment.completed_at = timezone.now()
        payment.save()

        if order.status == 'payment_not_received':
            order.status = 'payment_failed'
            order.save()

        return api_response(OrderDetailSerializer(order).data, 'Payment marked as failed')


class OrderListView(APIView):
    """GET /api/orders/ — List user's orders."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        orders = Order.objects.filter(user=request.user).prefetch_related(
            _order_items_prefetch()
        ).order_by('-created_at')
        serializer = OrderListSerializer(orders, many=True)
        return api_response(serializer.data)


class OrderDetailView(APIView):
    """GET /api/orders/{id}/ — Order detail."""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        order = get_object_or_404(
            Order.objects.prefetch_related(
                _order_items_prefetch(),
                Prefetch('status_history', queryset=OrderStatusHistory.objects.order_by('changed_at')),
            ),
            pk=pk, user=request.user
        )
        serializer = OrderDetailSerializer(order)
        return api_response(serializer.data)


class OrderCancelView(APIView):
    """POST /api/orders/{id}/cancel/ — Cancel an order."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        order = get_object_or_404(Order, pk=pk, user=request.user)

        if order.status not in ('payment_not_received', 'payment_received'):
            return api_error('Order can only be cancelled before preparation starts')

        order.status = 'cancelled'
        order.save()

        # Covered via save() override framework.

        # Restore stock
        for item in order.items.select_related('variant').all():
            variant = item.variant
            variant.stock += item.quantity
            variant.save()

        return api_response(OrderDetailSerializer(order).data, 'Order cancelled')


class OrderPaymentsView(APIView):
    """GET /api/orders/{id}/payments/ — Payment history for an order."""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        order = get_object_or_404(Order, pk=pk, user=request.user)
        payments = PaymentHistory.objects.filter(order=order)
        serializer = PaymentHistorySerializer(payments, many=True)
        return api_response(serializer.data)


class RazorpayWebhookView(APIView):
    """POST /api/orders/webhook/ — Handle Razorpay webhook events."""
    permission_classes = [AllowAny]

    @csrf_exempt
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)

    def post(self, request):
        webhook_secret = settings.RAZORPAY_WEBHOOK_SECRET
        webhook_signature = request.headers.get('X-Razorpay-Signature', '')
        webhook_body = request.body.decode('utf-8')

        # Verify webhook signature
        if webhook_secret:
            expected_signature = hmac.new(
                webhook_secret.encode('utf-8'),
                webhook_body.encode('utf-8'),
                hashlib.sha256
            ).hexdigest()

            if not hmac.compare_digest(expected_signature, webhook_signature):
                return api_error('Invalid webhook signature', status_code=status.HTTP_400_BAD_REQUEST)

        event = request.data.get('event', '')
        payload = request.data.get('payload', {})

        if event == 'payment.captured':
            self._handle_payment_captured(payload)
        elif event == 'payment.failed':
            self._handle_payment_failed(payload)
        elif event == 'refund.created':
            self._handle_refund_created(payload)

        return Response({'status': 'ok'})

    def _handle_payment_captured(self, payload):
        payment_entity = payload.get('payment', {}).get('entity', {})
        razorpay_order_id = payment_entity.get('order_id')
        razorpay_payment_id = payment_entity.get('id')

        payment = PaymentHistory.objects.filter(
            razorpay_order_id=razorpay_order_id,
            razorpay_payment_id=razorpay_payment_id
        ).first()

        if not payment:
            payment = PaymentHistory.objects.filter(
                razorpay_order_id=razorpay_order_id,
                status='initiated'
            ).first()

        if not payment:
            order = Order.objects.filter(razorpay_order_id=razorpay_order_id).first()
            if order:
                payment = PaymentHistory(
                    order=order,
                    user=order.user,
                    razorpay_order_id=razorpay_order_id,
                    amount=order.total_amount,
                )

        if payment:
            payment.status = 'success'
            payment.razorpay_payment_id = razorpay_payment_id
            payment.payment_method = payment_entity.get('method')
            payment.gateway_response = payment_entity
            payment.completed_at = timezone.now()
            payment.save()

        order = Order.objects.filter(razorpay_order_id=razorpay_order_id).first()
        if order:
            fulfill_paid_order(order, razorpay_payment_id)

    def _handle_payment_failed(self, payload):
        payment_entity = payload.get('payment', {}).get('entity', {})
        razorpay_order_id = payment_entity.get('order_id')
        razorpay_payment_id = payment_entity.get('id')
        error = payment_entity.get('error_description', 'Payment failed')

        payment = PaymentHistory.objects.filter(
            razorpay_order_id=razorpay_order_id,
            razorpay_payment_id=razorpay_payment_id
        ).first()

        if not payment:
            payment = PaymentHistory.objects.filter(
                razorpay_order_id=razorpay_order_id,
                status='initiated'
            ).first()

        if not payment:
            order = Order.objects.filter(razorpay_order_id=razorpay_order_id).first()
            if order:
                payment = PaymentHistory(
                    order=order,
                    user=order.user,
                    razorpay_order_id=razorpay_order_id,
                    amount=order.total_amount,
                )

        if payment:
            payment.status = 'failed'
            payment.razorpay_payment_id = razorpay_payment_id
            payment.failure_reason = error
            payment.gateway_response = payment_entity
            payment.completed_at = timezone.now()
            payment.save()

        order = Order.objects.filter(razorpay_order_id=razorpay_order_id).first()
        if order and order.status == 'payment_not_received':
            order.status = 'payment_failed'
            order.save()

    def _handle_refund_created(self, payload):
        refund_entity = payload.get('refund', {}).get('entity', {})
        payment_id = refund_entity.get('payment_id')

        payment = PaymentHistory.objects.filter(
            razorpay_payment_id=payment_id,
            status='success'
        ).first()

        if payment:
            refund_amount = Decimal(str(refund_entity.get('amount', 0))) / 100
            payment.refund_id = refund_entity.get('id')
            payment.refund_amount = refund_amount
            payment.status = 'refunded' if refund_amount >= payment.amount else 'partially_refunded'
            payment.save()
