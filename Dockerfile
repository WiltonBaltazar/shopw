# ─── Stage 1: Node – build frontend assets ────────────────────────────────────
FROM node:22-alpine AS node-builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --frozen-lockfile

COPY . .
RUN npm run build

# ─── Stage 2: Composer – prod deps ────────────────────────────────────────────
FROM composer:2.8 AS composer-prod

WORKDIR /app

COPY composer.json composer.lock ./
RUN composer install \
    --no-dev \
    --no-interaction \
    --no-scripts \
    --prefer-dist \
    --optimize-autoloader \
    --ignore-platform-reqs

COPY . .
RUN composer run-script post-autoload-dump || true

# ─── Stage 3: Composer – dev deps (includes dev packages) ─────────────────────
FROM composer:2.8 AS composer-dev

WORKDIR /app

COPY composer.json composer.lock ./
RUN composer install \
    --no-interaction \
    --no-scripts \
    --prefer-dist \
    --ignore-platform-reqs

COPY . .
RUN composer run-script post-autoload-dump || true

# ─── Stage 4: PHP base – shared system deps & extensions ──────────────────────
FROM php:8.3-fpm-alpine AS base

RUN apk add --no-cache \
        nginx \
        supervisor \
        curl \
        libpng-dev \
        libjpeg-turbo-dev \
        libwebp-dev \
        freetype-dev \
        libzip-dev \
        oniguruma-dev \
        icu-dev \
        mysql-client \
    && docker-php-ext-configure gd \
        --with-freetype \
        --with-jpeg \
        --with-webp \
    && docker-php-ext-install -j$(nproc) \
        pdo_mysql \
        mbstring \
        exif \
        pcntl \
        bcmath \
        gd \
        zip \
        intl \
        opcache

WORKDIR /var/www/html

RUN mkdir -p storage/framework/{cache,sessions,views} \
        storage/logs \
        bootstrap/cache

COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# ─── Stage 5: Development ─────────────────────────────────────────────────────
FROM base AS development

# Xdebug for local debugging
RUN apk add --no-cache $PHPIZE_DEPS linux-headers \
    && pecl install xdebug \
    && docker-php-ext-enable xdebug \
    && apk del $PHPIZE_DEPS

COPY docker/php/php.ini          /usr/local/etc/php/conf.d/app.ini
COPY docker/php/xdebug.ini       /usr/local/etc/php/conf.d/xdebug.ini
COPY docker/nginx/default.conf   /etc/nginx/http.d/default.conf
COPY docker/supervisor/supervisord.dev.conf /etc/supervisor/conf.d/supervisord.conf

# Copy deps (source is mounted as volume in dev)
COPY --from=composer-dev /app/vendor ./vendor
COPY --from=composer-dev /app/bootstrap/cache ./bootstrap/cache

RUN chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

EXPOSE 8080

ENTRYPOINT ["/entrypoint.sh"]
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]

# ─── Stage 6: Production / Staging ────────────────────────────────────────────
FROM base AS production

COPY docker/php/php.ini               /usr/local/etc/php/conf.d/app.ini
COPY docker/nginx/default.conf        /etc/nginx/http.d/default.conf
COPY docker/supervisor/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

COPY --from=composer-prod /app .
COPY --from=node-builder  /app/public/build ./public/build

RUN chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

EXPOSE 8080

ENTRYPOINT ["/entrypoint.sh"]
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
