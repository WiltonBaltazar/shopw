# Deployment Guide – Coolify + Contabo

## Prerequisites

- Contabo VPS with Coolify installed
- Domain DNS pointing to the VPS IP
- Code pushed to GitHub or GitLab

---

## 1. Push code to Git

```bash
git add .
git commit -m "add docker setup"
git push
```

---

## 2. Create the MySQL database in Coolify

**Dashboard → New Resource → Database → MySQL 8.0**

- Set a strong root password and user password
- Note down: host, port, database name, username, password
- Coolify gives you an **internal hostname** (e.g. `mysql-xxxxx`) — use this as `DB_HOST`

> Keep the DB as a separate resource so it survives app redeploys.

---

## 3. Create the app resource in Coolify

**Dashboard → New Resource → Application → select your Git repo**

| Setting | Value |
|---|---|
| Build pack | `Dockerfile` |
| Dockerfile target | `production` |
| Port | `8080` |
| Domain | `yourdomain.com` |

Coolify handles Traefik reverse proxy and SSL automatically.

---

## 4. Set environment variables

In Coolify → your app → **Environment Variables** tab:

```env
APP_NAME=My Store
APP_ENV=production
APP_KEY=                  # generate: php artisan key:generate --show
APP_DEBUG=false
APP_URL=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com

DB_CONNECTION=mysql
DB_HOST=                  # internal hostname from step 2
DB_PORT=3306
DB_DATABASE=my_store
DB_USERNAME=shopw
DB_PASSWORD=              # from step 2

SESSION_DRIVER=database
QUEUE_CONNECTION=database
CACHE_STORE=database
LOG_CHANNEL=stderr
LOG_LEVEL=error

MAIL_FROM_ADDRESS=hello@yourdomain.com
MAIL_FROM_NAME=My Store
```

Generate `APP_KEY` locally:

```bash
php artisan key:generate --show
```

---

## 5. Deploy

Click **Deploy** in Coolify. It will:

1. Clone the repo
2. Build the Docker image (Node → Composer → PHP multi-stage)
3. Start the container on port `8080`
4. Traefik picks it up and issues the SSL certificate

---

## 6. Post-deploy setup (first time only)

In Coolify → your app → **Terminal** tab:

```bash
php artisan migrate --force
php artisan storage:link
```

Or via SSH from your machine:

```bash
ssh user@your-vps-ip "docker exec <container_name> php artisan migrate --force"
```

---

## Subsequent deploys

Push to your branch — Coolify redeploys automatically via webhook.

To enable: Coolify → your app → **Webhooks** → copy the URL → add it to your GitHub/GitLab repo settings.

---

## Staging environment (same VPS)

Repeat steps 3–6 with a second resource:

| Setting | Value |
|---|---|
| Branch | `staging` (or your staging branch) |
| Dockerfile target | `production` |
| Port | `8081` |
| Domain | `staging.yourdomain.com` |

Use separate env vars and a separate MySQL database.

Both staging and production share the same Contabo VPS — Traefik routes by domain, not port, so there's no conflict with port 80/443.

---

## Port reference

| Environment | App port | MySQL port | Notes |
|---|---|---|---|
| Development | `8080` | `3307` | + Vite `:5173`, Mailpit `:8025` |
| Staging | `8081` | `3308` | Coolify proxies `staging.yourdomain.com` → `8081` |
| Production | `8080` | not exposed | DB only reachable inside Docker network |

---

## Common commands

```bash
# Local development
make dev              # start all services
make dev-migrate      # run migrations
make dev-seed         # seed database
make dev-shell        # open shell in app container
make dev-logs         # tail app logs
make dev-queue        # start queue worker manually

# Staging
make staging          # build and start staging
make staging-migrate  # run migrations on staging
make staging-shell    # open shell

# Production (local testing only — use Coolify for VPS)
make prod             # build and start production
make prod-logs        # tail logs
make prod-shell       # open shell
```
