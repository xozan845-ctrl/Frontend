# syntax=docker/dockerfile:1

# --- Etapa 1: build ---
FROM node:22-alpine AS build
WORKDIR /app
COPY frontend-app/package.json frontend-app/package-lock.json ./
RUN npm ci --prefer-offline
COPY frontend-app/ ./
RUN npm run build

# --- Etapa 2: runtime (nginx sirviendo el build estático) ---
FROM nginx:1.27-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Include opcional del proxy de IA (ADR-18); el entrypoint lo reescribe o vacía.
RUN touch /etc/nginx/conf.d/ai-scraper.conf
COPY --from=build /app/dist/frontend-app/browser /usr/share/nginx/html
# Config de runtime (/config.json) generada desde API_URL/STORE_ID al arrancar.
COPY docker-entrypoint.d/ /docker-entrypoint.d/
RUN chmod +x /docker-entrypoint.d/*.sh
EXPOSE 80
