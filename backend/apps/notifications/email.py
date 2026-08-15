"""Order email notifications — sent via the Resend Python SDK directly."""
import logging

import resend
from django.conf import settings

logger = logging.getLogger('apps.notifications')


ORDER_EMAIL_TEMPLATES = {
    'payment_received': (
        'Payment Received',
        'We have received your payment and your order is confirmed.',
    ),
    'payment_failed': (
        'Payment Failed',
        'We could not complete your payment. Please try again from checkout.',
    ),
    'preparing': (
        'Preparing Your Order',
        'Your order is now being carefully prepared.',
    ),
    'packed_shipped': (
        'Order Packed and Shipped',
        'Your order has been packed and is on its way to you.',
    ),
    'delivered': (
        'Order Delivered',
        'Your order has been delivered. We hope you love it!',
    ),
}


def send_order_email(template, order, user):
    """Send a transactional email via the Resend SDK for order status events."""
    if not user.email:
        logger.warning('Email notification skipped — no email address on user')
        return False

    template_config = ORDER_EMAIL_TEMPLATES.get(template)
    if not template_config:
        logger.warning(f'Unknown email template: {template}')
        return False

    status_label, intro = template_config
    order_ref = str(order.id)[:8].upper()
    subject = f'{status_label} - Order #{order_ref}'
    html_body = _build_order_email(order, user, status_label, intro)

    api_key = getattr(settings, 'RESEND_API_KEY', None)
    if not api_key and hasattr(settings, 'ANYMAIL'):
        api_key = settings.ANYMAIL.get('RESEND_API_KEY', '')
    if not api_key:
        logger.error('RESEND_API_KEY is not configured — email not sent')
        return False

    resend.api_key = api_key

    try:
        params = {
            'from': settings.DEFAULT_FROM_EMAIL,
            'to': [user.email],
            'subject': subject,
            'html': html_body,
        }
        result = resend.Emails.send(params)
        email_id = result.get('id') if isinstance(result, dict) else getattr(result, 'id', '')
        logger.info(
            f'Email sent via Resend to {user.email} — template: {template} | id: {email_id}'
        )
        return True
    except Exception as e:
        logger.error(f'Resend email failed for {user.email}: {e}')
        return False


def _build_order_email(order, user, status_label, intro):
    """Build a branded HTML order-status email body."""
    # Build items rows
    items_html = ''
    for item in order.items.select_related('variant__product').all():
        product_name = item.variant.product.name if item.variant else 'Deleted Product'
        metal_type = item.variant.metal_type if item.variant else ''
        size = item.variant.size if item.variant and item.variant.size else ''
        detail_parts = [p for p in [metal_type, ('Size ' + size) if size else ''] if p]
        detail = ' | '.join(detail_parts)
        line_total = '{:,.2f}'.format(item.line_total)
        items_html += (
            '<tr>'
            '<td style="padding:12px;border-bottom:1px solid #F2C4D0;">'
            + product_name
            + '<br><small style="color:#6B3A4A;">' + detail + '</small>'
            '</td>'
            '<td style="padding:12px;border-bottom:1px solid #F2C4D0;text-align:center;">'
            + str(item.quantity)
            + '</td>'
            '<td style="padding:12px;border-bottom:1px solid #F2C4D0;text-align:right;">INR '
            + line_total
            + '</td>'
            '</tr>'
        )

    # Build address block
    address_section = ''
    address = order.address
    if address:
        addr_html = (
            str(address.full_name) + '<br>'
            + str(address.street) + '<br>'
            + str(address.city) + ', ' + str(address.state) + ' - ' + str(address.pincode)
        )
        address_section = (
            '<div style="background:#fff;padding:16px;border-radius:8px;'
            'margin-top:20px;border-left:4px solid #8B1D52;">'
            '<h3 style="color:#8B1D52;margin:0 0 8px;font-size:13px;'
            'text-transform:uppercase;letter-spacing:1px;">Shipping To</h3>'
            '<p style="color:#1A0A10;margin:0;font-size:14px;line-height:1.6;">'
            + addr_html
            + '</p></div>'
        )

    store_name = getattr(settings, 'STORE_NAME', 'Lumiere Jewels')
    order_ref = str(order.id)[:8].upper()
    subtotal = '{:,.2f}'.format(order.subtotal_amount)
    total = '{:,.2f}'.format(order.total_amount)

    html = (
        '<!DOCTYPE html><html lang="en"><head>'
        '<meta charset="UTF-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1.0">'
        '</head><body style="margin:0;padding:0;background:#f4f4f4;">'
        '<div style="font-family:Arial,sans-serif;max-width:600px;margin:32px auto;'
        'background:#FAF0F3;border-radius:12px;overflow:hidden;'
        'box-shadow:0 4px 24px rgba(0,0,0,0.08);">'

        # Header
        '<div style="background:linear-gradient(135deg,#8B1D52 0%,#C9609A 100%);'
        'padding:32px 24px;text-align:center;">'
        '<h1 style="color:#fff;margin:0;font-size:26px;letter-spacing:1px;">'
        + store_name
        + '</h1>'
        '<p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">'
        'Fine Jewellery, Delivered with Love</p>'
        '</div>'

        # Body
        '<div style="padding:32px 24px;">'
        '<h2 style="color:#8B1D52;margin-top:0;font-size:22px;">' + status_label + '</h2>'
        '<p style="color:#1A0A10;font-size:16px;">Hello ' + user.name + ',</p>'
        '<p style="color:#1A0A10;font-size:15px;">' + intro + '</p>'
        '<p style="color:#1A0A10;">Order reference: '
        '<strong style="color:#8B1D52;">#' + order_ref + '</strong></p>'

        # Items table
        '<table style="width:100%;border-collapse:collapse;margin:24px 0;">'
        '<thead><tr style="background:#F2C4D0;">'
        '<th style="padding:12px;text-align:left;color:#8B1D52;font-size:13px;text-transform:uppercase;">Item</th>'
        '<th style="padding:12px;text-align:center;color:#8B1D52;font-size:13px;text-transform:uppercase;">Qty</th>'
        '<th style="padding:12px;text-align:right;color:#8B1D52;font-size:13px;text-transform:uppercase;">Price</th>'
        '</tr></thead>'
        '<tbody>' + items_html + '</tbody>'
        '</table>'

        # Totals
        '<div style="text-align:right;margin:16px 0;padding:16px;background:#fff;border-radius:8px;">'
        '<p style="margin:4px 0;color:#6B3A4A;font-size:14px;">Subtotal: INR ' + subtotal + '</p>'
        '<p style="margin:4px 0;color:#6B3A4A;font-size:14px;font-weight:500;">Shipping: ' + ('FREE' if order.shipping_charge == 0 else 'INR ' + '{:,.2f}'.format(order.shipping_charge)) + '</p>'
        '<p style="margin:12px 0 0;font-size:20px;color:#8B1D52;font-weight:700;">'
        'Total: INR ' + total
        + '</p></div>'

        + address_section
        
        + '<div style="text-align:center;margin-top:24px;">'
        + '<a href="' + getattr(settings, 'FRONTEND_URL', 'http://localhost:3000') + '/account/orders/' + str(order.id) + '" style="background:#8B1D52;color:#fff;text-decoration:none;padding:12px 24px;border-radius:4px;font-weight:bold;display:inline-block;">View Your Order</a>'
        + '</div>' 

        + '</div>'

        # Footer
        '<div style="background:#1A0A10;padding:24px;text-align:center;">'
        '<p style="color:#C96B8A;margin:0 0 6px;font-size:13px;">'
        + store_name + ' &middot; Free Shipping on All Orders</p>'
        '<p style="color:#6B3A4A;margin:0;font-size:11px;">'
        'This is an automated email, please do not reply.</p>'
        '</div>'

        '</div></body></html>'
    )
    return html


def send_admin_order_email(order, user):
    """Send an email to the admin when an order is successfully placed."""
    order_ref = str(order.id)[:8].upper()
    subject = f'New Order Placed - #{order_ref}'
    
    from django.urls import reverse
    try:
        admin_path = reverse('admin:orders_order_change', args=[order.id])
    except Exception:
        admin_path = f"/admin/orders/order/{order.id}/change/"
        
    backend_url = getattr(settings, 'BACKEND_URL', 'http://localhost:8000')
    admin_link = f"{backend_url.rstrip('/')}{admin_path}"
    
    payment_type = "Cash on Delivery (COD)" if order.shipping_charge > 0 else "Online Payment"
    
    items_html = ''
    for item in order.items.select_related('variant__product').all():
        product_name = item.variant.product.name if item.variant else 'Deleted Product'
        metal_type = item.variant.metal_type if item.variant else ''
        size = item.variant.size if item.variant and item.variant.size else ''
        detail_parts = [p for p in [metal_type, ('Size ' + size) if size else ''] if p]
        detail = ' | '.join(detail_parts)
        items_html += f'<li>{product_name} {("("+detail+")") if detail else ""} x {item.quantity} (INR {item.line_total})</li>'
        
    html_body = f"""
    <h2>New Order Placed</h2>
    <p><strong>Order ID:</strong> {order.id}</p>
    <p><strong>Customer:</strong> {user.name} ({user.email})</p>
    <p><strong>Payment Type:</strong> {payment_type}</p>
    <p><strong>Payment Status:</strong> {order.get_status_display()}</p>
    <p><strong>Total Amount:</strong> INR {order.total_amount}</p>
    <h3>Items Ordered:</h3>
    <ul>{items_html}</ul>
    <p><a href="{admin_link}">View Order in Admin Panel</a></p>
    """
    
    api_key = getattr(settings, 'RESEND_API_KEY', None)
    if not api_key and hasattr(settings, 'ANYMAIL'):
        api_key = settings.ANYMAIL.get('RESEND_API_KEY', '')
    if not api_key:
        return False

    import resend
    resend.api_key = api_key

    try:
        params = {
            'from': getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@xiphora.tech'),
            'to': ['tvisaasupport@gmail.com'],
            'subject': subject,
            'html': html_body,
        }
        resend.Emails.send(params)
        return True
    except Exception as e:
        import logging
        logger = logging.getLogger('apps.notifications')
        logger.error(f'Admin order email failed: {e}')
        return False
