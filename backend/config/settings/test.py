"""
Test settings — use an in-memory SQLite database so tests never touch
the real PostgreSQL database and run without any external dependencies.
"""
from .base import *  # noqa: F401,F403

DEBUG = True
ALLOWED_HOSTS = ['*']

# ── Use SQLite in-memory for speed and isolation ──────────────────────────────
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

# ── Skip migration runner — create schema directly from models ────────────────
# The products app has branched migrations that cause duplicate column errors
# when replayed on SQLite. Using DisableMigrations bypasses this issue and
# also makes test setup significantly faster.
class DisableMigrations:
    """Tell Django to use syncdb instead of running migration files."""
    def __contains__(self, item):
        return True
    def __getitem__(self, item):
        return None

MIGRATION_MODULES = DisableMigrations()

# ── Disable throttling by default — throttle tests enable it explicitly ───────
REST_FRAMEWORK['DEFAULT_THROTTLE_CLASSES'] = []
REST_FRAMEWORK['DEFAULT_THROTTLE_RATES'] = {}

# ── Disable cache to prevent cross-test state leaks ─────────────────────────────
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.dummy.DummyCache',
    }
}


# ── Suppress signal-driven tasks (revalidation calls, etc.) ──────────────────
REVALIDATION_SECRET = 'test-secret'
FRONTEND_URL = 'http://localhost:3000'

# ── Disable real email sending ────────────────────────────────────────────────
EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'

# ── Dummy AWS / Razorpay / Twilio creds (never called in tests) ───────────────
AWS_ACCESS_KEY_ID = 'test'
AWS_SECRET_ACCESS_KEY = 'test'
AWS_STORAGE_BUCKET_NAME = 'test-bucket'
AWS_S3_REGION_NAME = 'ap-south-1'
AWS_CLOUDFRONT_DOMAIN = ''
RAZORPAY_KEY_ID = 'rzp_test_key'
RAZORPAY_KEY_SECRET = 'rzp_test_secret'
RAZORPAY_WEBHOOK_SECRET = 'test_webhook_secret'
TWILIO_ACCOUNT_SID = 'test'
TWILIO_AUTH_TOKEN = 'test'

# ── Use local file storage for media (not S3) during tests ───────────────────
STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
    },
}
