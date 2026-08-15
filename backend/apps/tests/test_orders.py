"""
Orders test suite — tests/test_orders.py
==========================================
Tests order creation (Razorpay + COD), the idempotency guard,
payment verification, payment failure reporting, order list/detail,
order cancellation, and cross-user isolation.
"""
import hashlib
import hmac
from decimal import Decimal
from unittest.mock import patch, MagicMock
from django.utils import timezone
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from apps.orders.models import Order, OrderItem
from apps.products.models import ProductVariant
from .helpers import (
    make_verified_user, make_category, make_product, make_variant,
    make_address, make_cart_with_item, make_pending_order, AuthMixin,
)

NO_THROTTLE = override_settings(
    REST_FRAMEWORK={
        'DEFAULT_THROTTLE_CLASSES': [],
        'DEFAULT_THROTTLE_RATES': {},
    }
)

# ─── A fake Razorpay order response ──────────────────────────────────────────
FAKE_RZP_ORDER = {
    'id': 'order_test123456',
    'entity': 'order',
    'amount': 249900,
    'currency': 'INR',
    'status': 'created',
}


def _make_rzp_client_mock():
    mock_client = MagicMock()
    mock_client.order.create.return_value = FAKE_RZP_ORDER
    return mock_client


@NO_THROTTLE
class OrderCreationTests(APITestCase, AuthMixin):
    """POST /api/orders/create/"""
    URL = '/api/orders/create/'

    def setUp(self):
        self.user = make_verified_user(email='order@test.com')
        cat = make_category()
        prod = make_product(cat)
        self.variant = make_variant(prod, stock=10, price=Decimal('2499.00'))
        self.address = make_address(self.user)
        make_cart_with_item(self.user, self.variant, quantity=1)
        self.login_as(self.user)

    @patch('apps.orders.views.get_razorpay_client')
    def test_create_razorpay_order_success(self, mock_rzp):
        """Valid cart + address creates an order and returns Razorpay data."""
        mock_rzp.return_value = _make_rzp_client_mock()
        res = self.client.post(self.URL, {
            'address_id': str(self.address.id),
            'payment_method': 'razorpay',
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(res.data['success'])
        self.assertIn('razorpay_order_id', res.data['data'])
        # Order should be saved in DB
        self.assertTrue(Order.objects.filter(user=self.user).exists())

    def test_create_cod_order_success(self):
        """COD order is created, stock deducted, and cart cleared."""
        res = self.client.post(self.URL, {
            'address_id': str(self.address.id),
            'payment_method': 'COD',
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['data']['payment_method'], 'COD')
        # Stock should have been deducted
        self.variant.refresh_from_db()
        self.assertEqual(self.variant.stock, 9)

    def test_empty_cart_returns_error(self):
        """Creating an order with an empty cart returns 400."""
        from apps.cart.models import Cart
        Cart.objects.filter(user=self.user).delete()
        res = self.client.post(self.URL, {
            'address_id': str(self.address.id),
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_insufficient_stock_returns_error(self):
        """Ordering more than available stock returns 400."""
        from apps.cart.models import Cart, CartItem
        Cart.objects.filter(user=self.user).delete()
        cart, _ = Cart.objects.get_or_create(user=self.user)
        CartItem.objects.create(cart=cart, variant=self.variant, quantity=999)
        res = self.client.post(self.URL, {
            'address_id': str(self.address.id),
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_wrong_address_id_returns_404(self):
        """Using another user's address ID returns 404."""
        other_user = make_verified_user(email='other@test.com')
        other_addr = make_address(other_user)
        with patch('apps.orders.views.get_razorpay_client') as mock_rzp:
            mock_rzp.return_value = _make_rzp_client_mock()
            res = self.client.post(self.URL, {
                'address_id': str(other_addr.id),
            }, format='json')
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_unauthenticated_returns_401(self):
        """Unauthenticated request returns 401."""
        self.logout()
        res = self.client.post(self.URL, {
            'address_id': str(self.address.id),
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    @patch('apps.orders.views.get_razorpay_client')
    def test_idempotency_guard_returns_existing_order(self, mock_rzp):
        """
        Double-clicking checkout: second request within 30s returns the
        existing pending order instead of creating a duplicate.
        """
        mock_rzp.return_value = _make_rzp_client_mock()
        # First request — creates the order
        res1 = self.client.post(self.URL, {
            'address_id': str(self.address.id),
            'payment_method': 'razorpay',
        }, format='json')
        self.assertEqual(res1.status_code, status.HTTP_201_CREATED)
        order_id_1 = res1.data['data']['order_id']

        # Restore the cart item (simulate cart still populated for a double-click)
        # The first order creation doesn't clear the cart for Razorpay flow
        from apps.cart.models import Cart, CartItem
        cart = Cart.objects.get(user=self.user)
        item = CartItem.objects.filter(cart=cart, variant=self.variant).first()
        if item:
            item.quantity = 1
            item.save()
        else:
            CartItem.objects.create(cart=cart, variant=self.variant, quantity=1)

        # Second request — should return existing order, not create a new one
        res2 = self.client.post(self.URL, {
            'address_id': str(self.address.id),
            'payment_method': 'razorpay',
        }, format='json')
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        order_id_2 = res2.data['data']['order_id']

        # Same order ID returned
        self.assertEqual(order_id_1, order_id_2)
        # Only one order exists for this user
        self.assertEqual(Order.objects.filter(user=self.user).count(), 1)


@NO_THROTTLE
class OrderListDetailTests(APITestCase, AuthMixin):
    """GET /api/orders/ and GET /api/orders/{id}/"""

    def setUp(self):
        self.user = make_verified_user(email='list@test.com')
        cat = make_category()
        prod = make_product(cat)
        self.variant = make_variant(prod, stock=10)
        self.address = make_address(self.user)
        self.order = make_pending_order(self.user, self.address, self.variant)
        self.login_as(self.user)

    def test_list_orders_returns_user_orders(self):
        res = self.client.get('/api/orders/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data['data']), 1)

    def test_order_detail_returns_correct_order(self):
        res = self.client.get(f'/api/orders/{self.order.id}/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['data']['id'], str(self.order.id))

    def test_cannot_view_other_users_order(self):
        other_user = make_verified_user(email='other2@test.com')
        other_addr = make_address(other_user)
        other_order = make_pending_order(other_user, other_addr, self.variant)
        res = self.client.get(f'/api/orders/{other_order.id}/')
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_list_orders_requires_auth(self):
        self.logout()
        res = self.client.get('/api/orders/')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


@NO_THROTTLE
class OrderCancellationTests(APITestCase, AuthMixin):
    """POST /api/orders/{id}/cancel/"""

    def setUp(self):
        self.user = make_verified_user(email='cancel@test.com')
        cat = make_category()
        prod = make_product(cat)
        self.variant = make_variant(prod, stock=5)
        self.address = make_address(self.user)
        self.login_as(self.user)

    def test_cancel_payment_not_received_order(self):
        order = make_pending_order(self.user, self.address, self.variant, quantity=2)
        initial_stock = self.variant.stock
        res = self.client.post(f'/api/orders/{order.id}/cancel/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        order.refresh_from_db()
        self.assertEqual(order.status, 'cancelled')
        # Stock should be restored
        self.variant.refresh_from_db()
        self.assertEqual(self.variant.stock, initial_stock + 2)

    def test_cannot_cancel_preparing_order(self):
        order = make_pending_order(self.user, self.address, self.variant)
        order.status = 'preparing'
        order.save()
        res = self.client.post(f'/api/orders/{order.id}/cancel/')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cannot_cancel_other_users_order(self):
        other_user = make_verified_user(email='other3@test.com')
        other_addr = make_address(other_user)
        other_order = make_pending_order(other_user, other_addr, self.variant)
        res = self.client.post(f'/api/orders/{other_order.id}/cancel/')
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)


@NO_THROTTLE
class WebhookTests(APITestCase):
    """POST /api/orders/webhook/ — Razorpay webhook signature validation."""
    URL = '/api/orders/webhook/'

    @override_settings(RAZORPAY_WEBHOOK_SECRET='test_webhook_secret')
    def test_valid_signature_accepted(self):
        """A webhook with a valid HMAC signature returns 200."""
        import json
        payload = json.dumps({'event': 'payment.captured', 'payload': {}})
        secret = 'test_webhook_secret'
        signature = hmac.new(
            secret.encode('utf-8'),
            payload.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        res = self.client.post(
            self.URL,
            data=payload,
            content_type='application/json',
            HTTP_X_RAZORPAY_SIGNATURE=signature,
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    @override_settings(RAZORPAY_WEBHOOK_SECRET='test_webhook_secret')
    def test_invalid_signature_rejected(self):
        """A webhook with a tampered body returns 400."""
        import json
        payload = json.dumps({'event': 'payment.captured', 'payload': {}})
        res = self.client.post(
            self.URL,
            data=payload,
            content_type='application/json',
            HTTP_X_RAZORPAY_SIGNATURE='invalid_signature_xxxx',
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
