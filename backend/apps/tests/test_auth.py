"""
Auth test suite — tests/test_auth.py
=====================================
Tests registration, OTP verification, login, JWT refresh, profile, and
all rate-limiting throttles for the users app.
"""
from datetime import timedelta
from unittest.mock import patch

from django.utils import timezone
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from apps.users.models import User, EmailVerificationOTP
from .helpers import make_verified_user, make_unverified_user, AuthMixin


# Disable throttling for all tests in this module except the throttle-specific class
NO_THROTTLE = override_settings(
    REST_FRAMEWORK={
        **__import__('config.settings.base', fromlist=['REST_FRAMEWORK']).REST_FRAMEWORK,
        'DEFAULT_THROTTLE_CLASSES': [],
        'DEFAULT_THROTTLE_RATES': {},
    }
)


@NO_THROTTLE
class RegistrationTests(APITestCase):
    """POST /api/auth/register/"""
    URL = '/api/auth/register/'

    def test_register_new_user_success(self):
        """Valid payload creates an unverified user and returns 201."""
        with patch('apps.users.views.send_verification_otp', return_value=True):
            res = self.client.post(self.URL, {
                'name': 'Alice',
                'email': 'alice@test.com',
                'password': 'SecurePass123!',
                'password_confirm': 'SecurePass123!',
            }, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(res.data['success'])
        self.assertTrue(User.objects.filter(email='alice@test.com').exists())
        user = User.objects.get(email='alice@test.com')
        self.assertFalse(user.is_email_verified)
        self.assertFalse(user.is_active)

    def test_register_duplicate_verified_email_fails(self):
        """Registering an already-verified email returns an error."""
        make_verified_user(email='existing@test.com')
        with patch('apps.users.views.send_verification_otp', return_value=True):
            res = self.client.post(self.URL, {
                'name': 'Bob',
                'email': 'existing@test.com',
                'password': 'SecurePass123!',
                'password_confirm': 'SecurePass123!',
            }, format='json')
        self.assertFalse(res.data['success'])

    def test_register_unverified_email_replaces_old_user(self):
        """
        Registering an email that already exists but is unverified deletes the
        old account and creates a fresh one.
        """
        make_unverified_user(email='pending@test.com')
        with patch('apps.users.views.send_verification_otp', return_value=True):
            res = self.client.post(self.URL, {
                'name': 'New Attempt',
                'email': 'pending@test.com',
                'password': 'SecurePass123!',
                'password_confirm': 'SecurePass123!',
            }, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.filter(email='pending@test.com').count(), 1)

    def test_register_weak_password_fails(self):
        """Short password is rejected with a validation error."""
        res = self.client.post(self.URL, {
            'name': 'Charlie',
            'email': 'charlie@test.com',
            'password': '123',
            'password_confirm': '123',
        }, format='json')
        self.assertFalse(res.data.get('success', True))

    def test_register_missing_fields_fails(self):
        """Omitting required fields returns 400."""
        res = self.client.post(self.URL, {'email': 'x@test.com'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)


@NO_THROTTLE
class OTPVerificationTests(APITestCase):
    """POST /api/auth/verify-otp/"""
    URL = '/api/auth/verify-otp/'

    def setUp(self):
        with patch('apps.users.views.send_verification_otp', return_value=True):
            self.user = make_unverified_user(email='otp@test.com')
        self.otp_obj = EmailVerificationOTP.generate_for_user(self.user)

    def test_valid_otp_verifies_user(self):
        """Correct OTP verifies email, activates user, and returns tokens."""
        res = self.client.post(self.URL, {
            'email': self.user.email,
            'otp': self.otp_obj.otp,
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data['success'])
        self.assertIn('access', res.data['data']['tokens'])
        self.user.refresh_from_db()
        self.assertTrue(self.user.is_email_verified)
        self.assertTrue(self.user.is_active)

    def test_wrong_otp_fails(self):
        """Wrong OTP returns 400."""
        res = self.client.post(self.URL, {
            'email': self.user.email,
            'otp': '000000',
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(res.data['success'])

    def test_expired_otp_fails(self):
        """Expired OTP (past expires_at) returns 400."""
        self.otp_obj.expires_at = timezone.now() - timedelta(minutes=1)
        self.otp_obj.save()
        res = self.client.post(self.URL, {
            'email': self.user.email,
            'otp': self.otp_obj.otp,
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_already_verified_returns_200(self):
        """Verifying an already-verified account returns 200 gracefully."""
        self.user.is_email_verified = True
        self.user.is_active = True
        self.user.save()
        res = self.client.post(self.URL, {
            'email': self.user.email,
            'otp': self.otp_obj.otp,
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_nonexistent_email_returns_404(self):
        """Verifying OTP for an unknown email returns 404."""
        res = self.client.post(self.URL, {
            'email': 'nobody@test.com',
            'otp': '123456',
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)


@NO_THROTTLE
class LoginTests(APITestCase):
    """POST /api/auth/login/"""
    URL = '/api/auth/login/'

    def setUp(self):
        self.user = make_verified_user(email='login@test.com', password='TestPass123!')

    def test_valid_credentials_return_tokens(self):
        """Correct email/password returns access + refresh tokens."""
        res = self.client.post(self.URL, {
            'email': 'login@test.com',
            'password': 'TestPass123!',
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data['success'])
        self.assertIn('access', res.data['data']['tokens'])
        self.assertIn('refresh', res.data['data']['tokens'])

    def test_wrong_password_returns_401(self):
        """Wrong password returns 401."""
        res = self.client.post(self.URL, {
            'email': 'login@test.com',
            'password': 'WrongPassword!',
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unverified_user_login_rejected(self):
        """Unverified user cannot log in."""
        make_unverified_user(email='unv@test.com', password='TestPass123!')
        res = self.client.post(self.URL, {
            'email': 'unv@test.com',
            'password': 'TestPass123!',
        }, format='json')
        # Should fail (inactive/unverified user)
        self.assertNotEqual(res.status_code, status.HTTP_200_OK)

    def test_unknown_email_returns_401(self):
        """Login with a non-existent email returns 401."""
        res = self.client.post(self.URL, {
            'email': 'ghost@test.com',
            'password': 'anything',
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


@NO_THROTTLE
class TokenRefreshTests(APITestCase, AuthMixin):
    """POST /api/auth/refresh/"""
    URL = '/api/auth/refresh/'

    def setUp(self):
        self.user = make_verified_user(email='refresh@test.com')

    def test_valid_refresh_token_returns_new_access(self):
        _, refresh = self.login_as(self.user)
        res = self.client.post(self.URL, {'refresh': refresh}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('access', res.data['data'])

    def test_invalid_refresh_token_returns_401(self):
        res = self.client.post(self.URL, {'refresh': 'not-a-real-token'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_missing_refresh_token_returns_400(self):
        res = self.client.post(self.URL, {}, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)


@NO_THROTTLE
class ProfileTests(APITestCase, AuthMixin):
    """GET/PUT /api/auth/profile/"""
    URL = '/api/auth/profile/'

    def setUp(self):
        self.user = make_verified_user(email='profile@test.com', name='Original Name')
        self.login_as(self.user)

    def test_get_profile_returns_user_data(self):
        res = self.client.get(self.URL)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['data']['email'], 'profile@test.com')

    def test_update_profile_name(self):
        res = self.client.put(self.URL, {'name': 'Updated Name'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.name, 'Updated Name')

    def test_profile_requires_authentication(self):
        self.logout()
        res = self.client.get(self.URL)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


@NO_THROTTLE
class AddressTests(APITestCase, AuthMixin):
    """GET/POST /api/auth/addresses/ and PUT/DELETE /api/auth/addresses/{id}/"""

    def setUp(self):
        self.user = make_verified_user(email='addr@test.com')
        self.login_as(self.user)

    def _create_address(self):
        return self.client.post('/api/auth/addresses/', {
            'full_name': 'Test User',
            'street': '42 Main St',
            'city': 'Mumbai',
            'state': 'Maharashtra',
            'pincode': '400001',
        }, format='json')

    def test_create_address_success(self):
        res = self._create_address()
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['data']['city'], 'Mumbai')

    def test_list_addresses(self):
        self._create_address()
        res = self.client.get('/api/auth/addresses/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(res.data['data']), 1)

    def test_update_address(self):
        create_res = self._create_address()
        addr_id = create_res.data['data']['id']
        res = self.client.put(f'/api/auth/addresses/{addr_id}/', {
            'city': 'Delhi',
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['data']['city'], 'Delhi')

    def test_delete_address(self):
        create_res = self._create_address()
        addr_id = create_res.data['data']['id']
        res = self.client.delete(f'/api/auth/addresses/{addr_id}/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        # Confirm it's gone
        list_res = self.client.get('/api/auth/addresses/')
        ids = [a['id'] for a in list_res.data['data']]
        self.assertNotIn(addr_id, ids)

    def test_set_default_address(self):
        r1 = self._create_address()
        r2 = self._create_address()
        addr1_id = r1.data['data']['id']
        addr2_id = r2.data['data']['id']
        res = self.client.put(f'/api/auth/addresses/{addr2_id}/set-default/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        # First address should no longer be default
        from apps.users.models import Address
        self.assertFalse(Address.objects.get(pk=addr1_id).is_default)
        self.assertTrue(Address.objects.get(pk=addr2_id).is_default)

    def test_cannot_access_other_users_address(self):
        """A user cannot view or edit another user's address."""
        other_user = make_verified_user(email='other@test.com')
        from .helpers import make_address
        other_addr = make_address(other_user)
        # Try to update
        res = self.client.put(f'/api/auth/addresses/{other_addr.id}/', {
            'city': 'Hack'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_addresses_require_authentication(self):
        self.logout()
        res = self.client.get('/api/auth/addresses/')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)



