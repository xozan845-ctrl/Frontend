#!/bin/sh
# Genera la configuración de runtime (/config.json) desde variables de entorno
# antes de arrancar nginx. La imagen oficial de nginx ejecuta los scripts de
# /docker-entrypoint.d/ en orden (ver Dockerfile y docs/dockploy-setup.md §4).
#
# Variables:
#   API_URL   - URL base del gateway de Core Engine (opcional)
#   STORE_ID  - UUID de la tienda publicada cuyas ofertas consume el storefront
set -eu

CONFIG_PATH="/usr/share/nginx/html/config.json"

printf '{"apiUrl":"%s","storeId":"%s"}\n' "${API_URL:-}" "${STORE_ID:-}" > "$CONFIG_PATH"
