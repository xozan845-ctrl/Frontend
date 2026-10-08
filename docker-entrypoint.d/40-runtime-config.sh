#!/bin/sh
# Genera la configuración de runtime (/config.json) desde variables de entorno
# antes de arrancar nginx. La imagen oficial de nginx ejecuta los scripts de
# /docker-entrypoint.d/ en orden (ver Dockerfile y docs/dockploy-setup.md §4).
#
# Variables:
#   API_URL   - URL base del gateway de Core Engine (opcional)
set -eu

CONFIG_PATH="/usr/share/nginx/html/config.json"

printf '{"apiUrl":"%s"}\n' "${API_URL:-}" > "$CONFIG_PATH"
