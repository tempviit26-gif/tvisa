import uuid
from django.db import models
from django.conf import settings


class Wishlist(models.Model):
    """User wishlist item."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='wishlist', null=True, blank=True)
    guest_id = models.CharField(max_length=100, null=True, blank=True)
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE, related_name='wishlisted_by')
    added_at = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'wishlists'
        verbose_name = 'Wishlist Item'
        verbose_name_plural = 'Wishlist Items'
        ordering = ['-added_at']
        constraints = [
            models.CheckConstraint(
                check=(models.Q(user__isnull=False) & models.Q(guest_id__isnull=True)) |
                      (models.Q(user__isnull=True) & models.Q(guest_id__isnull=False)),
                name='wishlists_owner_check'
            ),
            models.UniqueConstraint(
                fields=['user', 'product'],
                condition=models.Q(user__isnull=False),
                name='wishlists_user_product_uq'
            ),
            models.UniqueConstraint(
                fields=['guest_id', 'product'],
                condition=models.Q(guest_id__isnull=False),
                name='wishlists_guest_product_uq'
            ),
        ]

    def __str__(self):
        owner = self.user.name if self.user else f"Guest ({self.guest_id})"
        return f'{owner} ♥ {self.product.name}'

