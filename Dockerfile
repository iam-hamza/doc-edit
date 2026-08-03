# Render has no native PHP runtime (only Node/Python/Ruby/Go/Rust/Elixir are
# native) — PHP apps deploy via Docker. Vite's Wayfinder plugin shells out to
# `php artisan wayfinder:generate` during `npm run build`, so the PHP app and
# its Composer dependencies must already exist before that build step runs;
# that coupling is why this is a single stage rather than a Node stage + PHP
# stage copying assets between them.
FROM php:8.3-cli-bookworm

RUN apt-get update && apt-get install -y --no-install-recommends \
        git \
        unzip \
        curl \
        libpq-dev \
        libzip-dev \
        libpng-dev \
        libonig-dev \
        libicu-dev \
    && docker-php-ext-install -j"$(nproc)" pdo_pgsql mbstring bcmath gd zip intl exif \
    && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

# Install PHP deps first so this layer is cached across builds that only
# touch application code.
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --optimize-autoloader

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# A placeholder key, scoped only to this RUN step via ARG (not persisted as
# an image ENV layer), so anything booting the framework during the build
# (wayfinder:generate) has a validly-formatted APP_KEY. This is NOT the key
# used at runtime — Render injects the real APP_KEY as an environment
# variable at container start, which this build-time value never touches.
ARG APP_KEY=base64:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=

RUN APP_KEY="${APP_KEY}" composer dump-autoload --optimize --no-dev \
    && APP_KEY="${APP_KEY}" npm run build \
    && rm -rf node_modules \
    && chown -R www-data:www-data storage bootstrap/cache

EXPOSE 8080

CMD ["sh", "-c", "php artisan migrate --force --no-interaction && php artisan config:cache && php artisan route:cache && php artisan serve --host=0.0.0.0 --port=${PORT:-8080}"]
