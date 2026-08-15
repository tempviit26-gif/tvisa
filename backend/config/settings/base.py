"""
Base settings for Lumière Jewels backend.
"""
import os
from pathlib import Path
from datetime import timedelta
from decouple import config, Csv

BASE_DIR = Path(__file__).resolve().parent.parent.parent

SECRET_KEY = config('SECRET_KEY', default='django-insecure-change-me-in-production')

DEBUG = config('DEBUG', default=False, cast=bool)

ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1', cast=Csv())

# ──────────────────────────────────────────────
# Store settings
# ──────────────────────────────────────────────
STORE_NAME = 'Lumière Jewels'

# ──────────────────────────────────────────────
# Application definition
# ──────────────────────────────────────────────
DJANGO_APPS = [
    'jazzmin',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]

THIRD_PARTY_APPS = [
    'anymail',
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'django_filters',
    'storages',
]

LOCAL_APPS = [
    'apps.users',
    'apps.products',
    'apps.cart',
    'apps.wishlist',
    'apps.orders',
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

# ──────────────────────────────────────────────
# Middleware
# ──────────────────────────────────────────────
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]
ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'
# ──────────────────────────────────────────────
# Database
# ──────────────────────────────────────────────
import dj_database_url  # noqa: E402

DATABASE_URL = config('RDS_DATABASE_URL', default=config('DATABASE_URL', default='sqlite:///db.sqlite3'))

if ('postgresql' in DATABASE_URL or 'postgres' in DATABASE_URL):
    _db_config = dj_database_url.parse(DATABASE_URL, conn_max_age=600)
    if not _db_config.get('NAME'):
        _db_config['NAME'] = 'postgres'
    DATABASES = {'default': _db_config}
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# ──────────────────────────────────────────────
# Auth
# ──────────────────────────────────────────────
AUTH_USER_MODEL = 'users.User'

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ──────────────────────────────────────────────
# Internationalization
# ──────────────────────────────────────────────
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Kolkata'
USE_I18N = True
USE_TZ = True

# ──────────────────────────────────────────────
# Static & Media files
# ──────────────────────────────────────────────
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ──────────────────────────────────────────────
# S3 media storage
# ──────────────────────────────────────────────
AWS_ACCESS_KEY_ID = config('AWS_ACCESS_KEY_ID', default='')
AWS_SECRET_ACCESS_KEY = config('AWS_SECRET_ACCESS_KEY', default='')
AWS_STORAGE_BUCKET_NAME = config('AWS_STORAGE_BUCKET_NAME', default='')
AWS_S3_REGION_NAME = config('AWS_S3_REGION_NAME', default='')
AWS_LOCATION = config('AWS_LOCATION', default='').strip('/')
AWS_DEFAULT_ACL = None
AWS_QUERYSTRING_AUTH = config('AWS_QUERYSTRING_AUTH', default=False, cast=bool)
AWS_S3_FILE_OVERWRITE = config('AWS_S3_FILE_OVERWRITE', default=False, cast=bool)
AWS_S3_SIGNATURE_VERSION = config('AWS_S3_SIGNATURE_VERSION', default='s3v4')
AWS_S3_OBJECT_PARAMETERS = {
    'CacheControl': config('AWS_S3_CACHE_CONTROL', default='max-age=31536000, public'),
}
AWS_CLOUDFRONT_DOMAIN = (
    config('AWS_CLOUDFRONT_DOMAIN', default='')
    .strip()
    .replace('https://', '')
    .replace('http://', '')
    .rstrip('/')
)
AWS_S3_CUSTOM_DOMAIN = AWS_CLOUDFRONT_DOMAIN or (
    f'{AWS_STORAGE_BUCKET_NAME}.s3.{AWS_S3_REGION_NAME}.amazonaws.com'
    if AWS_STORAGE_BUCKET_NAME and AWS_S3_REGION_NAME else ''
)
STORAGES = {
    "default": {
        "BACKEND": "config.storage.JPEGS3Storage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

# ──────────────────────────────────────────────
# Django REST Framework
# ──────────────────────────────────────────────
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'config.authentication.LenientJWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ),
    'DEFAULT_FILTER_BACKENDS': (
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 12,
    'DEFAULT_RENDERER_CLASSES': (
        'rest_framework.renderers.JSONRenderer',
        'rest_framework.renderers.BrowsableAPIRenderer',
    ),
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        # ── General browsing ──────────────────────────────────────────
        'anon': '60/minute',           # Unauthenticated product/browse traffic
        'user': '300/minute',          # Authenticated general traffic
        # ── Sensitive auth endpoints ──────────────────────────────────
        'login': '5/minute',           # Brute-force protection for login
        'register': '5/minute',        # Spam-account creation protection
        'otp_verify': '10/minute',     # OTP guessing protection
        'otp_resend': '3/minute',      # OTP resend abuse protection
        # ── High-value commerce endpoints ────────────────────────────
        'order_create': '10/minute',   # Prevent order flooding
        'payment_verify': '20/minute', # Prevent payment replay spam
    },
}

# ──────────────────────────────────────────────
# Simple JWT
# ──────────────────────────────────────────────
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=config('JWT_ACCESS_TOKEN_LIFETIME', default=15, cast=int)),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
}

# ──────────────────────────────────────────────
# CORS
# ──────────────────────────────────────────────
from corsheaders.defaults import default_headers

CORS_ALLOWED_ORIGINS = config(
    'CORS_ALLOWED_ORIGINS',
    default='http://localhost:3000',
    cast=Csv()
)
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = list(default_headers) + [
    'x-guest-id',
]

# ──────────────────────────────────────────────
# Email (Resend Python SDK — direct API calls)
# ──────────────────────────────────────────────
RESEND_API_KEY = config('RESEND_API_KEY', default='')
# Also expose via ANYMAIL for any anymail-aware code
ANYMAIL = {
    "RESEND_API_KEY": RESEND_API_KEY,
}
EMAIL_BACKEND = 'anymail.backends.resend.EmailBackend'
DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default='noreply@xiphora.tech')

# ──────────────────────────────────────────────
# Razorpay
# ──────────────────────────────────────────────
RAZORPAY_KEY_ID = config('RAZORPAY_KEY_ID', default='')
RAZORPAY_KEY_SECRET = config('RAZORPAY_KEY_SECRET', default='')
RAZORPAY_WEBHOOK_SECRET = config('RAZORPAY_WEBHOOK_SECRET', default='')

# ──────────────────────────────────────────────
# WhatsApp (Twilio)
# ──────────────────────────────────────────────
TWILIO_ACCOUNT_SID = config('TWILIO_ACCOUNT_SID', default='')
TWILIO_AUTH_TOKEN = config('TWILIO_AUTH_TOKEN', default='')
TWILIO_WHATSAPP_NUMBER = config('TWILIO_WHATSAPP_NUMBER', default='')

# ──────────────────────────────────────────────
# Frontend URL & Cache Revalidation
# ──────────────────────────────────────────────
FRONTEND_URL = config('FRONTEND_URL', default='http://localhost:3000')
# Must match REVALIDATION_SECRET on the Vercel/Next.js side
REVALIDATION_SECRET = config('REVALIDATION_SECRET', default='')

# ──────────────────────────────────────────────
# Jazzmin Admin Theme
# ──────────────────────────────────────────────
JAZZMIN_SETTINGS = {
    'site_title': 'Lumière Jewels Admin',
    'site_header': 'Lumière Jewels',
    'site_brand': 'Lumière Jewels',
    'welcome_sign': 'Welcome to Lumière Jewels Admin',
    'copyright': 'Lumière Jewels',
    'search_model': ['users.User', 'products.Product', 'orders.Order'],
    'topmenu_links': [
        {'name': 'Home', 'url': 'admin:index', 'permissions': ['auth.view_user']},
        {'name': 'View Site', 'url': '/', 'new_window': True},
    ],
    'show_sidebar': True,
    'navigation_expanded': True,
    'icons': {
        'auth': 'fas fa-users-cog',
        'users.User': 'fas fa-user',
        'products.Product': 'fas fa-gem',
        'products.Category': 'fas fa-tags',
        'orders.Order': 'fas fa-shopping-cart',
        'cart.Cart': 'fas fa-shopping-basket',
        'wishlist.Wishlist': 'fas fa-heart',
    },
    'default_icon_parents': 'fas fa-chevron-circle-right',
    'default_icon_children': 'fas fa-circle',
    'related_modal_active': True,
    'use_google_fonts_cdn': True,
    'changeform_format': 'horizontal_tabs',
}

JAZZMIN_UI_TWEAKS = {
    'theme': 'darkly',
    'dark_mode_theme': 'darkly',
}
