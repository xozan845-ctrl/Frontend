#!/bin/sh
# Genera la configuración de runtime (/config.json) desde variables de entorno
# antes de arrancar nginx. La imagen oficial de nginx ejecuta los scripts de
# /docker-entrypoint.d/ en orden (ver Dockerfile y docs/dockploy-setup.md §4).
#
# Variables:
#   API_URL                   - URL base del gateway de Core Engine (opcional).
#   AI_SCRAPER_PUBLIC_URL     - URL base del backend de IA vista por el navegador
#                               (opcional). Se usa si NO hay proxy.
#   AI_SCRAPER_URL            - URL base interna del backend de IA. Si se define,
#                               nginx publica `/ai-api/` como proxy same-origin y
#                               el navegador usa `/ai-api` (ADR-18, opción B).
#   AI_SCRAPER_API_KEY        - API key del backend de IA; el proxy la inyecta
#                               como `x-api-key`. Nunca llega al navegador (R-SE-2).
set -eu

CONFIG_PATH="/usr/share/nginx/html/config.json"
PROXY_PATH="/etc/nginx/conf.d/ai-scraper.conf"

# URL que verá el navegador para el backend de IA.
AI_SCRAPER_BROWSER_URL="${AI_SCRAPER_PUBLIC_URL:-}"

if [ -n "${AI_SCRAPER_URL:-}" ]; then
  # Proxy same-origin: el navegador llama a `/ai-api` y nginx añade la API key.
  AI_SCRAPER_BROWSER_URL="/ai-api"
  cat > "$PROXY_PATH" <<EOF
# Generado por 40-runtime-config.sh (ADR-18). Proxy same-origin hacia el backend
# de IA; inyecta la API key server-side para no exponerla al navegador (R-SE-2).
location ^~ /ai-api/ {
    proxy_pass ${AI_SCRAPER_URL}/;
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_set_header x-api-key "${AI_SCRAPER_API_KEY:-}";
    proxy_read_timeout 300s;
}
EOF
else
  # Sin backend interno configurado: no hay proxy (include vacío).
  : > "$PROXY_PATH"
fi

printf '{"apiUrl":"%s","aiScraperUrl":"%s"}\n' "${API_URL:-}" "$AI_SCRAPER_BROWSER_URL" > "$CONFIG_PATH"
