"""
Custom throttle classes for the users app.
Each class maps to a named scope in REST_FRAMEWORK['DEFAULT_THROTTLE_RATES'].
"""
from rest_framework.throttling import ScopedRateThrottle


class LoginRateThrottle(ScopedRateThrottle):
    """
    5 login attempts per minute per IP.
    Protects against brute-force credential attacks.
    """
    scope = 'login'


class RegisterRateThrottle(ScopedRateThrottle):
    """
    5 registration attempts per minute per IP.
    Prevents spam account creation and email bombing.
    """
    scope = 'register'


class OTPVerifyRateThrottle(ScopedRateThrottle):
    """
    10 OTP verification attempts per minute per IP.
    Prevents brute-forcing 6-digit OTP codes.
    """
    scope = 'otp_verify'


class OTPResendRateThrottle(ScopedRateThrottle):
    """
    3 OTP resend requests per minute per IP.
    Prevents email/SMS bombing via the resend endpoint.
    """
    scope = 'otp_resend'
