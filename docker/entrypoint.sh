#!/bin/sh
set -e

cd /var/www/html

# Generate app key if not set
if [ -z "$APP_KEY" ]; then
    php artisan key:generate --force
fi

# Cache config/routes/views for production
if [ "$APP_ENV" = "production" ]; then
    php artisan config:cache
    php artisan route:cache
    php artisan view:cache
fi

# Run migrations
php artisan migrate --force

# Fix storage permissions at runtime
chown -R www-data:www-data storage bootstrap/cache

# Storage symlink
php artisan storage:link --force 2>/dev/null || true

exec "$@"
