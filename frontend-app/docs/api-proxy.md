# Proxy público del API (gateway)

El frontend público de Firebase no envía el Basic del gate de staging. Llama al
proxy **server-side** del gateway, que añade la credencial y reenvía:

```text
https://kb-coleccion-internacional-ni.web.app
  └─ https://api.kbcoleccion.com/api-proxy/api/v1/...
       └─ gateway: añade Authorization: Basic (EDGE_BASIC_AUTH)
            └─ gateway interno /api/v1/...
```

## Configuración

`public/config.json`:

```json
{
  "apiUrl": "https://api.kbcoleccion.com/api-proxy/api/v1",
  "aiScraperUrl": ""
}
```

`src/environments/environment.prod.ts` usa el mismo valor como fallback.

No hay secretos en el frontend. El `Authorization: Basic` vive en
`EDGE_BASIC_AUTH` del gateway (Dockploy), nunca en el bundle.

## Reglas

- `login`, `registro`, `refresh`, `restablecer-contrasena`: el proxy añade Basic.
- Resto de rutas: se reenvía el `Bearer` del navegador; el gateway valida JWT.
- Si no hay Bearer, el proxy añade Basic.
- CORS: el gateway solo permite los orígenes de `CORS_ORIGINS`; debe incluir
  `https://kb-coleccion-internacional-ni.web.app`.
- La ruta `/api-proxy` es pública: no es una frontera de seguridad. La
  autorización real es el JWT + RLS. El Basic solo queda oculto del navegador.
- Body máximo 1 MB; las subidas de archivos van directas a MinIO con URL
  prefirmada.
- Timeout 60 s. Un 504 de identity/DB es del backend, no del proxy.

## Verificación

```sh
curl -i -X POST \
  https://api.kbcoleccion.com/api-proxy/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"correo":"noexiste@example.invalid","contrasena":"x"}'
# 400/401 del API, NO 401 del gate Basic

curl -i 'https://api.kbcoleccion.com/api-proxy/api/v1/catalog/productos?empresa_id=11111111-1111-4111-8111-111111111111'
# 200/400 JSON

curl -i https://api.kbcoleccion.com/api/v1/catalog/productos
# 401 Basic: la API directa sigue protegida
```

## Rollback

Vuelve a poner en `config.json` y `environment.prod.ts`:

```text
https://api.kbcoleccion.com/api/v1
```

y despliega el frontend.
