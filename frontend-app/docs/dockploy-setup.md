# Guion operativo: desplegar el frontend en Dockploy (VPS compartido con Core Engine)

> Documento **operativo** (no normativo): la normativa vive en
> [`rules/cd/`](./rules/cd/README.md) (`R-CD-*`) y el flujo de ramas en
> [`rules/git/00-flujo.md`](./rules/git/00-flujo.md) (`R-GB-*`). Este guion es la
> **lista de tareas** para dejar el despliegue acorde a esa normativa.
>
> **Estado:** el repo ya incluye `Dockerfile` (multi-stage, `node:22-alpine` →
> `nginx:1.27-alpine`) y `nginx.conf` versionados; los pasos restantes son la
> configuración del proyecto/environment en Dockploy y el dominio/HTTPS.

## 0. Objetivo

| Etapa      | Rama (`R-GB`)    | Dónde corre                        | Deploy                                       |
| ---------- | ---------------- | ---------------------------------- | -------------------------------------------- |
| Desarrollo | ramas `tipo/...` | **local** (`npm start`)            | no se despliega                              |
| Producción | `main`           | Dockploy, environment `produccion` | auto en push a `main` (solo por merge de PR) |

**Regla de oro:** a `main` solo llega un merge de PR con build verde (`R-GB-1`,
`R-CD-7`); ese push es lo que Dockploy despliega.

## 1. Requisitos antes de empezar

- Acceso a la UI de Dockploy del VPS y a su administrador.
- Token/credencial de GitHub que Dockploy usará para clonar **este repo**
  (`xozan845-ctrl/Frontend`).
- Node/npm local para construir el artefacto (`Node 22`, `npm ci`).

## 2. Proyecto Dockploy propio

**No reutilizar** el proyecto del backend Core Engine: el nombre del proyecto
determina los contenedores y no se mezclan dominios.

```
Proyecto: frontend-ecomerce
  └── environment: produccion        ← services desde rama main
        └── frontend-web (nginx)      ← sirve dist/frontend-app/browser
```

Pasos:

1. Crear el **proyecto `frontend-ecomerce`** (independiente de `core-engine`).
2. Crear el **environment `produccion`** apuntando a la rama `main`.
3. Definir el servicio `frontend-web` con build desde el `Dockerfile` del repo
   (nginx) y auto-deploy en push a `main`.
4. Publicar el dominio/HTTPS del frontend y enlazarlo al puerto del servidor web.
5. (Opcional, ADR nuevo) un environment `staging` desde una rama protegida
   concreta, sirviendo **el mismo build** (`R-CD-8`).

## 3. Artefactos versionados (raíz del repo)

- **`Dockerfile`** (raíz, multi-stage): `node:22-alpine` → `npm ci && npm run build`
  → `nginx:1.27-alpine` sirviendo `dist/frontend-app/browser`.
- **`nginx.conf`** (raíz) con **fallback de rutas SPA**, cabeceras de seguridad
  (CSP incluida) y reglas de cache:

  ```nginx
  location / {
    try_files $uri $uri/ /index.html;
  }
  ```

  Sin este fallback, refrescar `/shop` o `/checkout` devuelve 404.

- **Cache**: `index.html` sin cache (o `no-store`) y assets con hash
  (`outputHashing: all`) con cache larga.

## 4. Variables y configuración

- El frontend **no** lleva secretos en el bundle (`R-CD-2`): la URL del API es
  configuración pública. `environment.prod.ts` apunta al gateway del backend:
  `https://api.kbcoleccion.com/api/v1`.
- Si se necesitan URLs distintas por entorno, usar `fileReplacements` de
  `angular.json`, no valores inyectados a mano en el servidor (`R-CD-4`).
- **Configuración de runtime (`/config.json`)**: la app descarga `/config.json`
  al arrancar (`RuntimeConfigService`) y aplica sus valores no vacíos sobre
  `environment`. El contenedor lo genera desde variables de entorno con
  `docker-entrypoint.d/40-runtime-config.sh`, así que se ajusta **sin
  recompilar**:

  | Variable   | Descripción                                                         | Ejemplo                                |
  | ---------- | ------------------------------------------------------------------- | -------------------------------------- |
  | `API_URL`  | URL base del gateway de Core Engine (opcional; vacío = environment) | `https://api.kbcoleccion.com/api/v1`   |
  | `STORE_ID` | UUID de la tienda publicada cuyas ofertas consume el storefront     | `f7603931-b32d-4251-962a-a9c9e290d1c5` |

  En local se usa el fallback de `environment.ts` (la tienda de desarrollo).

## 5. Verificaciones tras el despliegue (smoke, `R-CD-9`)

| #   | Comprobación                                                               | ☐   |
| --- | -------------------------------------------------------------------------- | --- |
| 1   | `curl -fsS https://<dominio>/` responde 200                                | ☐   |
| 2   | La home carga el catálogo (o al menos el bundle inicial)                   | ☐   |
| 3   | Refrescar una ruta interna (`/shop`, `/checkout`) no da 404 (fallback SPA) | ☐   |
| 4   | La app alcanza el API configurado (login funciona)                         | ☐   |
| 5   | El token no viaja en el bundle (`R-CD-2`)                                  | ☐   |
| 6   | Rollback posible: redesplegar la versión anterior                          | ☐   |

## 6. Rollback en producción (`R-CD-10`)

1. En Dockploy, **redesplegar la versión anterior** del environment `produccion`.
2. Confirmar el smoke (`R-CD-9`).
3. Corregir con una rama `fix/...` y PR a `main` (`R-GB-6`); nunca editar el
   servidor a mano.

## 7. Errores frecuentes

- **404 al refrescar rutas internas**: falta el `try_files` de SPA (§3).
- **El frontend llama a un API vacío**: `environment.prod.ts` debe tener
  `apiUrl` configurado (`https://api.kbcoleccion.com/api/v1`); con `''` la app avisa.
- **Contenedores con nombre de otro proyecto**: verificar que el proyecto Dockploy
  es `frontend-ecomerce` y no comparte nombres con `core-engine`.
- **Assets con cache vieja tras deploy**: `index.html` debe servirse sin cache y
  los assets con hash.
