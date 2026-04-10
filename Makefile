DC_DEV     = docker compose -f docker-compose.yml -f docker-compose.dev.yml
DC_STAGING = docker compose -f docker-compose.yml -f docker-compose.staging.yml
DC_PROD    = docker compose -f docker-compose.yml -f docker-compose.prod.yml

# ─── Development ──────────────────────────────────────────────────────────────
.PHONY: dev
dev:
	@grep -q '^APP_KEY=base64:' .env.development 2>/dev/null || php artisan key:generate
	$(DC_DEV) up --build

dev-d:
	$(DC_DEV) up --build -d

dev-down:
	$(DC_DEV) down

dev-key:
	$(DC_DEV) exec app php artisan key:generate

dev-migrate:
	$(DC_DEV) exec app php artisan migrate

dev-seed:
	$(DC_DEV) exec app php artisan db:seed

dev-tinker:
	$(DC_DEV) exec app php artisan tinker

dev-queue:
	$(DC_DEV) exec app php artisan queue:work --tries=3

dev-logs:
	$(DC_DEV) logs -f app

dev-shell:
	$(DC_DEV) exec app sh

# ─── Staging ──────────────────────────────────────────────────────────────────
.PHONY: staging
staging:
	@grep -q '^APP_KEY=base64:' .env.staging 2>/dev/null || { echo "ERROR: APP_KEY not set in .env.staging"; exit 1; }
	$(DC_STAGING) up --build -d

staging-down:
	$(DC_STAGING) down

staging-migrate:
	$(DC_STAGING) exec app php artisan migrate --force

staging-logs:
	$(DC_STAGING) logs -f app

staging-shell:
	$(DC_STAGING) exec app sh

# ─── Production ───────────────────────────────────────────────────────────────
.PHONY: prod
prod:
	@grep -q '^APP_KEY=base64:' .env.production 2>/dev/null || { echo "ERROR: APP_KEY not set in .env.production"; exit 1; }
	$(DC_PROD) up --build -d

prod-down:
	$(DC_PROD) down

prod-migrate:
	$(DC_PROD) exec app php artisan migrate --force

prod-logs:
	$(DC_PROD) logs -f app

prod-shell:
	$(DC_PROD) exec app sh

# ─── Shared ───────────────────────────────────────────────────────────────────
.PHONY: build-prod
build-prod:
	docker build --target production -t shopw:latest .

build-staging:
	docker build --target production -t shopw:staging .
