# Base44 Dev Environment

## Project Overview

This is a **static HTML project** — no build system, no backend, no package manager.
The main app is **Mesa Certa**, a single-file HTML/JS/CSS simulator for organizing
business rounds at networking events. It lives at:

- `Get Connected Sorocaba 2026/Rodadas de Negocio/rodadas-de-negocio.html` (source)
- `Get Connected Sorocaba 2026/Rodadas de Negocio/site-mesacerta/index.html` (publishable copy — identical content)

The repo also contains email campaign HTML files, banners, and administrative documents.

## How It Runs

Served by **nginx:alpine** via `docker-compose.base44.yml`. The `site-mesacerta`
directory is bind-mounted at a clean path (`/usr/share/nginx/mesacerta`) to avoid
nginx issues with spaces in directory names. The root URL (`/`) serves the Mesa
Certa app; all other repo files are browsable at their paths.

- **Port**: 3000 (mapped to nginx port 80)
- **Start**: `docker compose -f docker-compose.base44.yml up -d`
- **Health check**: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/`
- **No credentials needed** — fully static, no external services.

## Key Quirks

- Directory names contain **spaces** (e.g. "Get Connected Sorocaba 2026"). The
  nginx config avoids this by mounting `site-mesacerta` at a space-free path.
- The two HTML files (`rodadas-de-negocio.html` and `site-mesacerta/index.html`)
  are identical copies. The `site-mesacerta` version is the one meant for Vercel
  deployment (has `vercel.json`, `.vercelignore`, `publicar.bat`).
- No live reload needed — nginx serves static files; changes appear on browser refresh.
