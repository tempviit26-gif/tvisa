"""
Production settings — extends base.py.
"""
from .base import *  # noqa: F401,F403
from decouple import config

DEBUG = False

ALLOWED_HOSTS = config(
    'ALLOWED_HOSTS',
    default='localhost,127.0.0.1,.onrender.com',
    cast=lambda v: [s.strip() for s in v.split(',') if s.strip()]
)
if '.onrender.com' not in ALLOWED_HOSTS and '*' not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append('.onrender.com')

CSRF_TRUSTED_ORIGINS = config(
    'CSRF_TRUSTED_ORIGINS',
    default='https://*.onrender.com,https://*.vercel.app',
    cast=lambda v: [s.strip() for s in v.split(',') if s.strip()]
)

# Security
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_SSL_REDIRECT = config('SECURE_SSL_REDIRECT', default=False, cast=bool)
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# Database
import dj_database_url  # noqa: E402
# Database configuration – use PostgreSQL if DATABASE_URL is set, otherwise fall back to SQLite for local/dev
_db_url = config('RDS_DATABASE_URL', default=config('DATABASE_URL', default=''))
if _db_url:
    _db_config = dj_database_url.parse(_db_url, conn_max_age=600)
    if not _db_config.get('NAME'):
        _db_config['NAME'] = 'postgres'
    DATABASES = {'default': _db_config}
else:
    # Simple SQLite fallback (useful for local testing of production settings)
    from pathlib import Path
    BASE_DIR = Path(__file__).resolve().parent.parent.parent
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }
STATIC_ROOT = BASE_DIR / "staticfiles"
# Remove browsable API in production
REST_FRAMEWORK['DEFAULT_RENDERER_CLASSES'] = (
    'rest_framework.renderers.JSONRenderer',
)

# Logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'WARNING',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'WARNING',
            'propagate': False,
        },
        'apps': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}
