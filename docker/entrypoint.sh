#!/bin/sh
set -e

cd /var/www/html

# Generate app key if not set
if [ -z "$APP_KEY" ]; then
    if [ "$APP_ENV" = "local" ]; then
        # Dev only: generate an ephemeral key and export it so php-fpm inherits it
        APP_KEY=$(php artisan key:generate --show --force)
        export APP_KEY
    else
        echo "ERROR: APP_KEY is not set. Inject it as a secret via your deployment platform (e.g. Coolify)." >&2
        exit 1
    fi
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
