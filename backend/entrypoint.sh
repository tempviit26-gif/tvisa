#!/bin/sh
set -e

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Running migrations..."
python manage.py migrate --fake-initial --noinput

echo "Starting server..."
exec gunicorn \
    --bind 0.0.0.0:8000 \
    --workers 1 \
    --timeout 300 \
    config.wsgi:application