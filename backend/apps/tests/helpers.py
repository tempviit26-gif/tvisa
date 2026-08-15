"""
Shared test helpers, mixins, and fixtures used across all test modules.
"""
from decimal import Decimal
from django.utils import timezone
from apps.users.models import User, Address, EmailVerificationOTP
from apps.products.models import Category, Product, ProductVariant
from apps.cart.models import Cart, CartItem
from apps.orders.models import Order, OrderItem


# ─── Factory helpers ──────────────────────────────────────────────────────────

def make_verified_user(email='user@test.com', name='Test User', password='TestPass123!'):
    """Create a fully-verified, active user."""
    user = User.objects.create_user(email=email, name=name, password=password)
    user.is_active = True
    user.is_email_verified = True
    user.save()
    return user


def make_unverified_user(email='unverified@test.com', name='Unverified User', password='TestPass123!'):
    """Create an unverified user (just registered, OTP pending)."""
    user = User.objects.create_user(email=email, name=name, password=password)
    return user


def make_category(name='Rings', slug='rings'):
    return Category.objects.create(name=name, slug=slug, is_active=True)


def make_product(category, name='Gold Ring', base_price=Decimal('1999.00')):
    return Product.objects.create(
        category=category,
        name=name,
        description='A beautiful gold ring.',
        base_price=base_price,
        is_active=True,
    )


def make_variant(product, metal_type='18k Gold', price=Decimal('2499.00'), stock=10, sku=None):
    import uuid
    return ProductVariant.objects.create(
        product=product,
        metal_type=metal_type,
        price=price,
        stock=stock,
        sku=sku or f'SKU-{uuid.uuid4().hex[:8].upper()}',
    )


def make_address(user, full_name='Test User'):
    return Address.objects.create(
        user=user,
        full_name=full_name,
        street='123 Test Street',
        city='Mumbai',
        state='Maharashtra',
        pincode='400001',
    )


def make_cart_with_item(user, variant, quantity=1):
    cart, _ = Cart.objects.get_or_create(user=user)
    CartItem.objects.create(cart=cart, variant=variant, quantity=quantity)
    return cart


def make_pending_order(user, address, variant, quantity=1, amount=Decimal('2499.00')):
    """Create a payment_not_received order with an item."""
    order = Order.objects.create(
        user=user,
        address=address,
        status='payment_not_received',
        subtotal_amount=amount,
        shipping_charge=Decimal('0.00'),
        discount_amount=Decimal('0.00'),
        total_amount=amount,
        razorpay_order_id='rzp_test_dummy_order_123',
    )
    OrderItem.objects.create(
        order=order,
        variant=variant,
        quantity=quantity,
        price_at_purchase=amount,
    )
    return order


# ─── Auth mixin ───────────────────────────────────────────────────────────────

class AuthMixin:
    """Mixin to authenticate the APIClient as a given user."""

    def login_as(self, user):
        """Obtain JWT tokens and set Authorization header on self.client."""
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        return str(refresh.access_token), str(refresh)

    def logout(self):
        self.client.credentials()
