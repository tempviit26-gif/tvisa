"""
Custom throttle classes for the orders app.
Each class maps to a named scope in REST_FRAMEWORK['DEFAULT_THROTTLE_RATES'].
"""
from rest_framework.throttling import ScopedRateThrottle


class OrderCreateRateThrottle(ScopedRateThrottle):
    """
    10 order creation requests per minute per user.
    Prevents order flooding and abuse of the payment gateway.
    """
    scope = 'order_create'


class PaymentVerifyRateThrottle(ScopedRateThrottle):
    """
    20 payment verification requests per minute per user.
    Prevents payment replay and verification spamming.
    """
    scope = 'payment_verify'
