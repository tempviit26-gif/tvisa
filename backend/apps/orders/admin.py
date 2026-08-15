from django import forms
from django.contrib import admin
from django.utils.html import format_html
from .models import Order, OrderItem, OrderStatusHistory, PaymentHistory


# ── Status choices shown in the admin dropdown ──────────────────────────────
# Matches exactly what the user asked for. The model retains 'cancelled' /
# 'refunded' for code-managed transitions; admins never need to set those.
ADMIN_STATUS_CHOICES = [
    # ── Payment stage ────────────────────────────────────────────────────────
    ('payment_not_received', '⏳ Payment Not Received'),
    ('payment_received',     '✅ Payment Received'),
    ('payment_failed',       '❌ Payment Declined'),
    # ── Fulfilment stage ─────────────────────────────────────────────────────
    ('preparing',            '🛠️  Order Prepared'),
    ('packed_shipped',       '📦 Order Parcelled and Shipped'),
    ('delivered',            '🎉 Delivered'),
]

# Human-readable badge colours for the list view
STATUS_COLOURS = {
    'payment_not_received': '#e67e22',   # orange
    'payment_received':     '#27ae60',   # green
    'payment_failed':       '#e74c3c',   # red
    'preparing':            '#2980b9',   # blue
    'packed_shipped':       '#8e44ad',   # purple
    'delivered':            '#16a085',   # teal
    'cancelled':            '#7f8c8d',   # grey
    'refunded':             '#7f8c8d',   # grey
}


class OrderStatusForm(forms.ModelForm):
    """Restrict the status dropdown to the admin-manageable choices.

    We deliberately allow the *current* value even if it falls outside
    ADMIN_STATUS_CHOICES (e.g. 'cancelled', 'refunded') so that the change
    form never crashes with a 500.  The dropdown will still only offer the
    curated list for new selections.
    """

    status = forms.ChoiceField(choices=ADMIN_STATUS_CHOICES)

    class Meta:
        model = Order
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        instance = kwargs.get('instance')
        if instance:
            current = instance.status
            known = [v for v, _ in ADMIN_STATUS_CHOICES]
            # If the current status is not in the curated list, prepend it so
            # the form shows the real current value and doesn't fail validation.
            if current not in known:
                label = instance.get_status_display()
                self.fields['status'].choices = [
                    (current, f'[current] {label}')
                ] + ADMIN_STATUS_CHOICES


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    can_delete = False
    readonly_fields = ('variant', 'quantity', 'price_at_purchase', 'line_total')

    def line_total(self, obj):
        if obj.pk is None or obj.price_at_purchase is None or obj.quantity is None:
            return '-'
        return f'₹{obj.line_total:,.2f}'
    line_total.short_description = 'Line Total'

    def has_add_permission(self, request, obj=None):
        return False


class OrderStatusHistoryInline(admin.TabularInline):
    model = OrderStatusHistory
    extra = 0
    readonly_fields = ('status', 'note', 'changed_at')
    ordering = ('-changed_at',)

    def has_add_permission(self, request, obj=None):
        return False


class PaymentHistoryInline(admin.TabularInline):
    model = PaymentHistory
    extra = 0
    readonly_fields = (
        'razorpay_order_id', 'razorpay_payment_id', 'amount',
        'currency', 'status', 'payment_method', 'failure_reason',
        'initiated_at', 'completed_at',
    )
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    form = OrderStatusForm

    list_display = (
        'short_id', 'user', 'coloured_status',
        'total_amount_display', 'created_at',
    )
    list_filter  = ('status', 'created_at')
    search_fields = ('id', 'user__name', 'user__email', 'razorpay_order_id')

    readonly_fields = (
        'id', 'user', 'subtotal_amount', 'shipping_charge',
        'discount_amount', 'total_amount', 'razorpay_order_id',
        'razorpay_payment_id', 'created_at', 'updated_at',
    )

    fieldsets = (
        ('Order Details', {
            'fields': ('id', 'user', 'address', 'status'),
        }),
        ('Tracking', {
            'fields': ('tracking_link',),
            'description': 'Add the delivery partner tracking URL here when marking the order as Packed and Shipped. This link will be visible to the customer.',
        }),
        ('Financials', {
            'fields': (
                'subtotal_amount', 'discount_amount',
                'shipping_charge', 'total_amount',
            ),
        }),
        ('Payment Gateway', {
            'fields': ('razorpay_order_id', 'razorpay_payment_id'),
            'classes': ('collapse',),
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )

    inlines = [OrderItemInline, OrderStatusHistoryInline, PaymentHistoryInline]

    # ── Custom columns ────────────────────────────────────────────────────────

    def short_id(self, obj):
        return str(obj.id)[:8].upper()
    short_id.short_description = 'Order ID'

    def coloured_status(self, obj):
        colour = STATUS_COLOURS.get(obj.status, '#7f8c8d')
        label  = obj.get_status_display()
        return format_html(
            '<span style="'
            'background:{colour};color:#fff;padding:3px 10px;'
            'border-radius:12px;font-size:12px;font-weight:600;'
            'white-space:nowrap;">{label}</span>',
            colour=colour,
            label=label,
        )
    coloured_status.short_description = 'Status'

    def total_amount_display(self, obj):
        return f'₹{obj.total_amount:,.2f}'
    total_amount_display.short_description = 'Total'

    def get_list_display_links(self, request, list_display):
        return ('short_id',)


@admin.register(PaymentHistory)
class PaymentHistoryAdmin(admin.ModelAdmin):
    list_display  = ('order', 'amount', 'status', 'payment_method', 'initiated_at')
    list_filter   = ('status', 'payment_method')
    readonly_fields = (
        'order', 'user', 'razorpay_order_id', 'razorpay_payment_id',
        'razorpay_signature', 'amount', 'currency', 'status',
        'payment_method', 'failure_reason', 'refund_id', 'refund_amount',
        'gateway_response', 'initiated_at', 'completed_at',
    )
