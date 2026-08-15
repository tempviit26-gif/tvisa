from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.shortcuts import get_object_or_404
from django.db.models import Prefetch
from .models import Cart, CartItem
from .serializers import CartSerializer, CartItemCreateSerializer, CartItemUpdateSerializer
from apps.products.models import ProductVariant, ProductImage

def get_cart_identifier(request):
    if request.user.is_authenticated:
        return {'user': request.user}
    
    guest_id = request.headers.get('X-Guest-ID')
    if not guest_id:
        return None
    return {'guest_id': guest_id}

def _cart_with_prefetch(identifier):
    """Return the user's or guest's cart (creating if absent) with all related data prefetched in 3 queries."""
    if not identifier:
        return None
        
    cart, _ = Cart.objects.get_or_create(**identifier)
    return Cart.objects.prefetch_related(
        Prefetch(
            'items',
            queryset=CartItem.objects.select_related(
                'variant__product__category',
                'variant__product__subcategory',
            ).prefetch_related(
                Prefetch(
                    'variant__product__images',
                    queryset=ProductImage.objects.order_by('display_order'),
                )
            )
        )
    ).get(pk=cart.pk)


def api_response(data=None, message='Success', success=True, status_code=status.HTTP_200_OK):
    return Response({'success': success, 'data': data, 'message': message}, status=status_code)


def api_error(error='An error occurred', details=None, status_code=status.HTTP_400_BAD_REQUEST):
    return Response({'success': False, 'error': error, 'details': details or {}}, status=status_code)


class CartView(APIView):
    """GET /api/cart/ — Get user's or guest's cart."""
    permission_classes = [AllowAny]

    def get(self, request):
        identifier = get_cart_identifier(request)
        if not identifier:
            return api_response({'items': [], 'total_items': 0, 'subtotal': 0})
            
        cart = _cart_with_prefetch(identifier)
        serializer = CartSerializer(cart)
        return api_response(serializer.data)


class CartItemAddView(APIView):
    """POST /api/cart/items/ — Add item to cart."""
    permission_classes = [AllowAny]

    def post(self, request):
        identifier = get_cart_identifier(request)
        if not identifier:
            return api_error('Missing authentication or guest ID', status_code=status.HTTP_401_UNAUTHORIZED)
            
        serializer = CartItemCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return api_error('Validation failed', serializer.errors)

        variant = get_object_or_404(ProductVariant, pk=serializer.validated_data['variant_id'])
        quantity = serializer.validated_data['quantity']

        if variant.stock < quantity:
            return api_error(f'Only {variant.stock} items available in stock')

        cart, _ = Cart.objects.get_or_create(**identifier)

        # Update quantity if item already in cart
        cart_item, created = CartItem.objects.get_or_create(
            cart=cart, variant=variant,
            defaults={'quantity': quantity}
        )
        if not created:
            cart_item.quantity += quantity
            if cart_item.quantity > variant.stock:
                return api_error(f'Cannot add more. Only {variant.stock} available.')
            cart_item.save()

        cart.save()  # Update timestamp
        return api_response(CartSerializer(_cart_with_prefetch(identifier)).data, 'Item added to cart')


class CartItemUpdateView(APIView):
    """PUT /api/cart/items/{id}/ — Update item quantity."""
    permission_classes = [AllowAny]

    def put(self, request, pk):
        identifier = get_cart_identifier(request)
        if not identifier:
            return api_error('Unauthorized', status_code=status.HTTP_401_UNAUTHORIZED)
            
        cart = get_object_or_404(Cart, **identifier)
        cart_item = get_object_or_404(CartItem, pk=pk, cart=cart)

        serializer = CartItemUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return api_error('Validation failed', serializer.errors)

        quantity = serializer.validated_data['quantity']
        if quantity > cart_item.variant.stock:
            return api_error(f'Only {cart_item.variant.stock} available in stock')

        cart_item.quantity = quantity
        cart_item.save()
        cart.save()
        return api_response(CartSerializer(_cart_with_prefetch(identifier)).data, 'Cart updated')


class CartItemDeleteView(APIView):
    """DELETE /api/cart/items/{id}/ — Remove item from cart."""
    permission_classes = [AllowAny]

    def delete(self, request, pk):
        identifier = get_cart_identifier(request)
        if not identifier:
            return api_error('Unauthorized', status_code=status.HTTP_401_UNAUTHORIZED)
            
        cart = get_object_or_404(Cart, **identifier)
        cart_item = get_object_or_404(CartItem, pk=pk, cart=cart)
        cart_item.delete()
        cart.save()
        return api_response(CartSerializer(_cart_with_prefetch(identifier)).data, 'Item removed from cart')


class CartClearView(APIView):
    """DELETE /api/cart/clear/ — Clear all items from cart."""
    permission_classes = [AllowAny]

    def delete(self, request):
        identifier = get_cart_identifier(request)
        if not identifier:
            return api_error('Unauthorized', status_code=status.HTTP_401_UNAUTHORIZED)
            
        cart = get_object_or_404(Cart, **identifier)
        cart.items.all().delete()
        cart.save()
        return api_response(CartSerializer(_cart_with_prefetch(identifier)).data, 'Cart cleared')
