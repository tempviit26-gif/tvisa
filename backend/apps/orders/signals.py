import logging

from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import OrderStatusHistory

logger = logging.getLogger('apps.orders')


EMAIL_STATUS_TEMPLATES = {
    'payment_received': 'payment_received',
    'payment_failed': 'payment_failed',
    'preparing': 'preparing',
    'packed_shipped': 'packed_shipped',
    'delivered': 'delivered',
}

@receiver(post_save, sender=OrderStatusHistory)
def handle_status_change(sender, instance, created, **kwargs):
    """Trigger customer emails when an order status changes."""
    if not created:
        return

    order = instance.order
    user = order.user
    status_val = instance.status

    email_template = EMAIL_STATUS_TEMPLATES.get(status_val)
    if not email_template:
        return

    from apps.notifications.email import send_order_email

    try:
        send_order_email(
            template=email_template,
            order=order,
            user=user,
        )
    except Exception as e:
        logger.error(f'Email notification failed for order #{str(order.id)[:8]}: {e}')

    if status_val in ('payment_received', 'preparing'):
        # Only send if the order has never reached a confirmed state before
        past_confirmed = OrderStatusHistory.objects.filter(
            order=order,
            status__in=['payment_received', 'preparing'],
            created_at__lt=instance.created_at
        ).exists()
        
        if not past_confirmed:
            from apps.notifications.email import send_admin_order_email
            send_admin_order_email(order, user)
