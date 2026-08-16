import uuid
from django.db import models
from django.conf import settings


class Cart(models.Model):
    """Shopping cart — one per user."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='cart', null=True, blank=True)
    guest_id = models.CharField(max_length=100, null=True, blank=True, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'carts'
        verbose_name = 'Cart'
        verbose_name_plural = 'Carts'
        constraints = [
            models.CheckConstraint(
                check=(models.Q(user__isnull=False) & models.Q(guest_id__isnull=True)) |
                      (models.Q(user__isnull=True) & models.Q(guest_id__isnull=False)),
                name='carts_owner_check'
            ),
        ]

    def __str__(self):
        owner = self.user.name if self.user else f"Guest ({self.guest_id})"
        return f'Cart — {owner}'

    @property
    def total_items(self):
        return self.items.aggregate(total=models.Sum('quantity'))['total'] or 0

    @property
    def subtotal(self):
        return sum(item.line_total for item in self.items.select_related('variant').all())


class CartItem(models.Model):
    """Item in a shopping cart."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    variant = models.ForeignKey('products.ProductVariant', on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'cart_items'
        verbose_name = 'Cart Item'
        verbose_name_plural = 'Cart Items'
        unique_together = ('cart', 'variant')
        constraints = [
            models.CheckConstraint(
                check=models.Q(quantity__gt=0),
                name='cart_items_quantity_check'
            ),
        ]

    def __str__(self):
        return f'{self.variant} × {self.quantity}'

    @property
    def line_total(self):
        return self.variant.price * self.quantity
