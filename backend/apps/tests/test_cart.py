"""
Cart test suite — tests/test_cart.py
======================================
Tests add/update/remove/clear cart operations for both authenticated
users and anonymous guests (via X-Guest-ID header), plus stock validation.
"""
from decimal import Decimal
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from apps.cart.models import Cart, CartItem
from .helpers import (
    make_verified_user, make_category, make_product, make_variant,
    make_cart_with_item, AuthMixin,
)

NO_THROTTLE = override_settings(
    REST_FRAMEWORK={
        'DEFAULT_THROTTLE_CLASSES': [],
        'DEFAULT_THROTTLE_RATES': {},
    }
)


def _setup_product():
    cat = make_category()
    prod = make_product(cat)
    variant = make_variant(prod, stock=5)
    return variant


@NO_THROTTLE
class GuestCartTests(APITestCase):
    """Cart operations for unauthenticated guests using X-Guest-ID header."""
    GUEST_ID = 'test-guest-id-abc123'

    def setUp(self):
        self.variant = _setup_product()
        self.client.defaults['HTTP_X_GUEST_ID'] = self.GUEST_ID

    def test_get_empty_cart(self):
        res = self.client.get('/api/cart/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['data']['total_items'], 0)

    def test_add_item_to_guest_cart(self):
        res = self.client.post('/api/cart/items/', {
            'variant_id': str(self.variant.id),
            'quantity': 2,
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['data']['total_items'], 2)

    def test_add_item_exceeding_stock_fails(self):
        res = self.client.post('/api/cart/items/', {
            'variant_id': str(self.variant.id),
            'quantity': 100,  # stock is only 5
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_add_same_item_twice_accumulates_quantity(self):
        self.client.post('/api/cart/items/', {
            'variant_id': str(self.variant.id),
            'quantity': 1,
        }, format='json')
        self.client.post('/api/cart/items/', {
            'variant_id': str(self.variant.id),
            'quantity': 2,
        }, format='json')
        cart = Cart.objects.get(guest_id=self.GUEST_ID)
        item = CartItem.objects.get(cart=cart, variant=self.variant)
        self.assertEqual(item.quantity, 3)

    def test_no_guest_id_returns_empty_cart(self):
        """Without a guest ID or auth token, GET /api/cart/ returns empty."""
        self.client.defaults.pop('HTTP_X_GUEST_ID', None)
        res = self.client.get('/api/cart/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['data']['total_items'], 0)

    def test_add_without_guest_id_returns_401(self):
        """Adding items without any identity returns 401."""
        self.client.defaults.pop('HTTP_X_GUEST_ID', None)
        res = self.client.post('/api/cart/items/', {
            'variant_id': str(self.variant.id),
            'quantity': 1,
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


@NO_THROTTLE
class AuthenticatedCartTests(APITestCase, AuthMixin):
    """Cart operations for authenticated users."""

    def setUp(self):
        self.user = make_verified_user(email='cart@test.com')
        self.variant = _setup_product()
        self.login_as(self.user)

    def test_get_cart_authenticated(self):
        res = self.client.get('/api/cart/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_add_item_to_auth_cart(self):
        res = self.client.post('/api/cart/items/', {
            'variant_id': str(self.variant.id),
            'quantity': 1,
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['data']['total_items'], 1)

    def test_update_item_quantity(self):
        # Add item first
        self.client.post('/api/cart/items/', {
            'variant_id': str(self.variant.id),
            'quantity': 1,
        }, format='json')
        cart = Cart.objects.get(user=self.user)
        item = CartItem.objects.get(cart=cart)
        # Update it
        res = self.client.put(f'/api/cart/items/{item.id}/', {'quantity': 3}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        item.refresh_from_db()
        self.assertEqual(item.quantity, 3)

    def test_update_quantity_beyond_stock_fails(self):
        self.client.post('/api/cart/items/', {
            'variant_id': str(self.variant.id),
            'quantity': 1,
        }, format='json')
        cart = Cart.objects.get(user=self.user)
        item = CartItem.objects.get(cart=cart)
        res = self.client.put(f'/api/cart/items/{item.id}/', {'quantity': 999}, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_remove_item_from_cart(self):
        self.client.post('/api/cart/items/', {
            'variant_id': str(self.variant.id),
            'quantity': 1,
        }, format='json')
        cart = Cart.objects.get(user=self.user)
        item = CartItem.objects.get(cart=cart)
        res = self.client.delete(f'/api/cart/items/{item.id}/delete/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(CartItem.objects.filter(cart=cart).count(), 0)

    def test_clear_cart(self):
        # Add two different items (use two variants with different skus)
        cat = make_category(name='Bangles', slug='bangles')
        prod2 = make_product(cat, name='Bangle')
        v2 = make_variant(prod2, sku='SKU-BANGLE-01')
        self.client.post('/api/cart/items/', {'variant_id': str(self.variant.id), 'quantity': 1}, format='json')
        self.client.post('/api/cart/items/', {'variant_id': str(v2.id), 'quantity': 1}, format='json')
        res = self.client.delete('/api/cart/clear/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        cart = Cart.objects.get(user=self.user)
        self.assertEqual(CartItem.objects.filter(cart=cart).count(), 0)

    def test_cart_isolated_between_users(self):
        """User A's cart is not visible to user B."""
        make_cart_with_item(self.user, self.variant)
        user_b = make_verified_user(email='b@test.com')
        self.login_as(user_b)
        res = self.client.get('/api/cart/')
        # User B's cart should be empty
        self.assertEqual(res.data['data']['total_items'], 0)
