from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.shortcuts import get_object_or_404
from django.core.mail import send_mail
from django.conf import settings
from .models import User, Address, EmailVerificationOTP
from .serializers import (
    UserRegistrationSerializer,
    UserLoginSerializer,
    UserProfileSerializer,
    AddressSerializer,
    VerifyOTPSerializer,
    ResendOTPSerializer,
)
from .throttles import (
    LoginRateThrottle,
    RegisterRateThrottle,
    OTPVerifyRateThrottle,
    OTPResendRateThrottle,
)


def api_response(data=None, message='Success', success=True, status_code=status.HTTP_200_OK):
    """Standard API response helper."""
    return Response({
        'success': success,
        'data': data,
        'message': message,
    }, status=status_code)


def api_error(error='An error occurred', details=None, status_code=status.HTTP_400_BAD_REQUEST):
    """Standard API error helper."""
    return Response({
        'success': False,
        'error': error,
        'details': details or {},
    }, status=status_code)


def send_verification_otp(user, otp_code):
    """Send a verification OTP via Email (Resend) and WhatsApp (Twilio)."""
    subject = f'{settings.STORE_NAME} — Verify Your Email'
    message = (
        f'Hello {user.name},\n\n'
        f'Your verification code is:\n\n'
        f'    {otp_code}\n\n'
        f'This code is valid for 10 minutes.\n\n'
        f'— {settings.STORE_NAME}'
    )
    
    success = False
    
    # 1. Send via Email (Resend through Django/Anymail)
    try:
        print(f"\n[EMAIL DEBUG] Attempting to send OTP email to {user.email} via Resend")
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
        print(f"[SUCCESS] OTP email successfully sent to {user.email}")
        success = True
    except Exception as e:
        print(f"[ERROR] [EMAIL DEBUG ERROR] Failed to send OTP email to {user.email}")
        print(f"[ERROR] [EMAIL EXCEPTION DETAIL]: {type(e).__name__} - {str(e)}")
        import traceback
        traceback.print_exc()

    # 2. Send via WhatsApp (Twilio)
    if user.phone:
        try:
            print(f"\n[TWILIO DEBUG] Attempting to send WhatsApp OTP to {user.phone}")
            from twilio.rest import Client
            client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
            
            # Ensure phone has + prefix for whatsapp
            to_phone = user.phone if user.phone.startswith('+') else f"+{user.phone}"
            
            # Ensure from number has whatsapp: prefix
            from_phone = settings.TWILIO_WHATSAPP_NUMBER if settings.TWILIO_WHATSAPP_NUMBER.startswith('whatsapp:') else f"whatsapp:{settings.TWILIO_WHATSAPP_NUMBER}"
            print(f"[TWILIO DEBUG] FROM: {from_phone} | TO: whatsapp:{to_phone}")
            
            wa_message = client.messages.create(
                body=f"Your {settings.STORE_NAME} verification code is: *{otp_code}*. Valid for 10 mins.",
                from_=from_phone,
                to=f"whatsapp:{to_phone}"
            )
            print(f"[SUCCESS] OTP WhatsApp successfully sent to {to_phone}. SID: {wa_message.sid}")
            success = True
        except Exception as e:
            print(f"[ERROR] [TWILIO DEBUG ERROR] Failed to send WhatsApp OTP to {user.phone}")
            print(f"[ERROR] [TWILIO EXCEPTION DETAIL]: {type(e).__name__} - {str(e)}")
            
    return success


class RegisterView(APIView):
    """POST /api/auth/register/ — Create a new user account and send OTP."""
    permission_classes = [AllowAny]
    throttle_classes = [RegisterRateThrottle]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()

        # If an unverified user already exists with this email, delete them
        # so the email can be re-used for a fresh registration attempt
        existing = User.objects.filter(email=email).first()
        if existing and not existing.is_email_verified:
            existing.delete()

        serializer = UserRegistrationSerializer(data=request.data)
        if not serializer.is_valid():
            return api_error('Validation failed', serializer.errors)

        user = serializer.save()

        # Generate OTP and send via Email + WhatsApp
        otp = EmailVerificationOTP.generate_for_user(user)
        send_verification_otp(user, otp.otp)

        return api_response({
            'email': user.email,
            'message': 'A verification code has been sent to your email.',
        }, 'Registration successful. Please verify your email.', status_code=status.HTTP_201_CREATED)


class VerifyOTPView(APIView):
    """POST /api/auth/verify-otp/ — Verify email with OTP code."""
    permission_classes = [AllowAny]
    throttle_classes = [OTPVerifyRateThrottle]

    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        if not serializer.is_valid():
            return api_error('Validation failed', serializer.errors)

        email = serializer.validated_data['email']
        otp_code = serializer.validated_data['otp']

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return api_error('User not found', status_code=status.HTTP_404_NOT_FOUND)

        if user.is_email_verified:
            return api_response(message='Email is already verified')

        try:
            otp_obj = EmailVerificationOTP.objects.filter(user=user, otp=otp_code).latest('created_at')
        except EmailVerificationOTP.DoesNotExist:
            return api_error('Invalid OTP code')

        if otp_obj.is_expired:
            otp_obj.delete()
            return api_error('OTP has expired. Please request a new one.')

        # Activate the user
        user.is_email_verified = True
        user.is_active = True
        user.save()
        otp_obj.delete()

        # Merge guest cart and wishlist if any
        guest_id = request.headers.get('X-Guest-ID')
        if guest_id:
            from apps.cart.models import Cart
            from apps.wishlist.models import Wishlist
            
            # Merge Cart
            guest_cart = Cart.objects.filter(guest_id=guest_id).first()
            if guest_cart:
                user_cart, created = Cart.objects.get_or_create(user=user)
                if not created:
                    # Move items from guest cart to user cart
                    for item in guest_cart.items.all():
                        existing = user_cart.items.filter(variant=item.variant).first()
                        if existing:
                            existing.quantity += item.quantity
                            existing.save()
                        else:
                            item.cart = user_cart
                            item.save()
                    guest_cart.delete()
                else:
                    guest_cart.user = user
                    guest_cart.guest_id = None
                    guest_cart.save()
            
            # Merge Wishlist
            Wishlist.objects.filter(guest_id=guest_id).update(user=user, guest_id=None)

        # Generate JWT tokens so the user is auto-logged-in
        refresh = RefreshToken.for_user(user)

        return api_response({
            'user': UserProfileSerializer(user).data,
            'tokens': {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            }
        }, 'Email verified successfully')


class ResendOTPView(APIView):
    """POST /api/auth/resend-otp/ — Resend a new OTP to the user's email."""
    permission_classes = [AllowAny]
    throttle_classes = [OTPResendRateThrottle]

    def post(self, request):
        serializer = ResendOTPSerializer(data=request.data)
        if not serializer.is_valid():
            return api_error('Validation failed', serializer.errors)

        email = serializer.validated_data['email']

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # For security, don't reveal whether the email exists
            return api_response(message='If this email is registered, a new OTP has been sent.')

        if user.is_email_verified:
            return api_response(message='Email is already verified')

        otp = EmailVerificationOTP.generate_for_user(user)
        send_verification_otp(user, otp.otp)

        return api_response(message='A new verification code has been sent to your email.')


class LoginView(APIView):
    """POST /api/auth/login/ — Authenticate and get JWT tokens."""
    permission_classes = [AllowAny]
    throttle_classes = [LoginRateThrottle]

    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        if not serializer.is_valid():
            return api_error('Invalid credentials', serializer.errors, status.HTTP_401_UNAUTHORIZED)

        user = serializer.validated_data['user']

        # Merge guest cart and wishlist if any
        guest_id = request.headers.get('X-Guest-ID')
        if guest_id:
            from apps.cart.models import Cart
            from apps.wishlist.models import Wishlist
            
            # Merge Cart
            guest_cart = Cart.objects.filter(guest_id=guest_id).first()
            if guest_cart:
                user_cart, created = Cart.objects.get_or_create(user=user)
                if not created:
                    # Move items from guest cart to user cart
                    for item in guest_cart.items.all():
                        existing = user_cart.items.filter(variant=item.variant).first()
                        if existing:
                            existing.quantity += item.quantity
                            existing.save()
                        else:
                            item.cart = user_cart
                            item.save()
                    guest_cart.delete()
                else:
                    guest_cart.user = user
                    guest_cart.guest_id = None
                    guest_cart.save()
            
            # Merge Wishlist
            Wishlist.objects.filter(guest_id=guest_id).update(user=user, guest_id=None)

        refresh = RefreshToken.for_user(user)

        return api_response({
            'user': UserProfileSerializer(user).data,
            'tokens': {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            }
        }, 'Login successful')


class RefreshTokenView(APIView):
    """POST /api/auth/refresh/ — Refresh JWT access token."""
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return api_error('Refresh token is required')

        try:
            refresh = RefreshToken(refresh_token)
            return api_response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            }, 'Token refreshed')
        except Exception:
            return api_error('Invalid or expired refresh token', status_code=status.HTTP_401_UNAUTHORIZED)


class ProfileView(APIView):
    """GET/PUT /api/auth/profile/ — View or update user profile."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return api_response(serializer.data)

    def put(self, request):
        serializer = UserProfileSerializer(request.user, data=request.data, partial=True)
        if not serializer.is_valid():
            return api_error('Validation failed', serializer.errors)
        serializer.save()
        return api_response(serializer.data, 'Profile updated')


class AddressListCreateView(APIView):
    """GET/POST /api/auth/addresses/ — List or create addresses."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        addresses = Address.objects.filter(user=request.user)
        serializer = AddressSerializer(addresses, many=True)
        return api_response(serializer.data)

    def post(self, request):
        serializer = AddressSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            return api_error('Validation failed', serializer.errors)
        serializer.save()
        return api_response(serializer.data, 'Address created', status_code=status.HTTP_201_CREATED)


class AddressDetailView(APIView):
    """PUT/DELETE /api/auth/addresses/{id}/ — Update or delete an address."""
    permission_classes = [IsAuthenticated]

    def get_address(self, request, pk):
        return get_object_or_404(Address, pk=pk, user=request.user)

    def put(self, request, pk):
        address = self.get_address(request, pk)
        serializer = AddressSerializer(address, data=request.data, partial=True)
        if not serializer.is_valid():
            return api_error('Validation failed', serializer.errors)
        serializer.save()
        return api_response(serializer.data, 'Address updated')

    def delete(self, request, pk):
        address = self.get_address(request, pk)
        address.delete()
        return api_response(message='Address deleted')


class SetDefaultAddressView(APIView):
    """PUT /api/auth/addresses/{id}/set-default/ — Set address as default."""
    permission_classes = [IsAuthenticated]

    def put(self, request, pk):
        address = get_object_or_404(Address, pk=pk, user=request.user)
        address.is_default = True
        address.save()
        return api_response(AddressSerializer(address).data, 'Default address updated')
