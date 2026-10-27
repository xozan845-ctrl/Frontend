# Guion operativo: desplegar el frontend en Firebase Hosting (staging, plan gratuito)

> Documento **operativo** (no normativo). La normativa de CD vive en
> [`rules/cd/`](./rules/cd/README.md) (`R-CD-*`). Este guion es la **lista de
> tareas** para publicar el **mismo artefacto** estático de Angular
> (`dist/frontend-app/browser`) en **Firebase Hosting** como entorno de
> **staging**, sin tocar el despliegue de producción en Dockploy.
>
> **Alcance:** solo el **frontend**. El backend (Core Engine y el backend de IA
> `ai_scraper_executor`) son independientes y **no** se despliegan aquí.

## 0. Objetivo

| Entorno    | Rama (`R-GB`)    | Dónde corre                                | Deploy                   |
| ---------- | ---------------- | ------------------------------------------ | ------------------------ |
| Desarrollo | ramas `tipo/...` | local (`npm start`)                        | no se despliega          |
| Staging    | `main` o ramas   | **Firebase Hosting** (plan Spark)          | manual o preview channel |
| Producción | `main`           | Dockploy (nginx), environment `produccion` | auto en push a `main`    |

Firebase Hosting se usa como **staging / demo público**: es un artefacto
estático servido desde la CDN de Google, con HTTPS y dominio incluidos en el
plan gratuito.

## 1. Requisitos

- Node.js 20+ y npm 10+ (la app ya los requiere).
- `firebase-tools` (CLI) disponible:
  ```bash
  npm install -g firebase-tools   # o: npx firebase-tools@15 <comando>
  firebase --version              # 15.x
  ```
- Cuenta de Google con acceso al proyecto **Firebase**
  `kb-coleccion-internacional-ni`.

## 2. Artefactos versionados

- **`firebase.json`** (en `frontend-app/`): configuración del sitio.
  - `public`: `dist/frontend-app/browser` (misma salida que nginx, `R-CD-4`).
  - **Fallback SPA** (`rewrites: ** → /index.html`): refrescar `/tienda/<id>/shop`,
    `/carrito`, etc. devuelve 200 en lugar de 404 (equivalente al `try_files` de
    `nginx.conf`). Las rutas de invitación (`/i/**` y `/registro/vendedor`) se
    sirven desde `invitacion.html`, una copia del shell con metadatos Open Graph
    propios; se genera en el `postbuild`.
  - **Caché**: `index.html`, `ngsw-worker.js`, `ngsw.json`, `manifest.webmanifest`
    y `config.json` sin cache; assets con hash (`outputHashing: all`) con cache
    larga (`max-age=31536000, immutable`).
  - **Cabeceras de seguridad** (nosniff, X-Frame-Options, Referrer-Policy y
    **CSP**) replicando `nginx.conf`.
- **`.firebaserc`**: proyecto por defecto (`kb-coleccion-internacional-ni`).

> **Sin proxy de IA.** El `nginx.conf` publica `/ai-api/` e inyecta la API key
> server-side (ADR-18, opción B). El **plan Spark no incluye Cloud Functions /
> Cloud Run**, así que ese proxy **no se puede replicar** en Hosting. El feature
> `/ia` debe apuntar **directo** a la URL pública del backend (con **CORS**
> habilitado) y la **API key se introduce en runtime** en `/ia` (ya soportado,
> `R-SE-2`).

## 3. Configuración de la app

- **API del backend**: `environment.prod.ts` y `public/config.json` apuntan al
  proxy público `https://api.kbcoleccion.com/api-proxy/api/v1` (ADR-50). El
  proxy añade el Basic del gate de staging en el servidor; el navegador no lleva
  credenciales. Como el origen del sitio en Firebase es
  `https://kb-coleccion-internacional-ni.web.app`, ese origen debe estar
  permitido en el **CORS del backend**.
- **Override en runtime sin recompilar** (`/config.json`): la app descarga
  `config.json` al arrancar y aplica los valores no vacíos sobre `environment`.
  El archivo vive en `public/config.json` y se copia al build. Solo se aplica
  en builds de producción; en `ng serve` se conserva el API local de
  `environment.ts`. En este repo ya lleva el API de producción; para apuntar a
  otro API o al backend de IA **en este entorno**, edítalo antes de desplegar:

  ```json
  {
    "apiUrl": "https://api.kbcoleccion.com/api-proxy/api/v1",
    "aiScraperUrl": "https://<backend-ia-publico>/api/v1"
  }
  ```

  Deja un valor en `""` para conservar el de `environment` (`R-AR-11`). Tras
  editarlo hay que **reconstruir** (`npm run build`), porque en Hosting no hay
  entrypoint que lo regenere.

### Vista previa de invitaciones en WhatsApp

WhatsApp (y la mayoría de crawlers) **no ejecuta JavaScript**: lee el HTML que
devuelve Hosting. Como la SPA reescribe todo a `index.html`, una invitación
compartida mostraba el host y la URL cruda, sin imagen.

- `scripts/generate-invitation-html.mjs` corre como `postbuild`: copia el
  `index.html` compilado, le cambia el título y los metadatos OG/Twitter y lo
  escribe como `invitacion.html`.
- `firebase.json` sirve ese archivo en `/i/**` y `/registro/vendedor`; el resto
  sigue usando `index.html`.
- `public/og-invitacion.png` (1200 × 630) se genera con `npm run og-image` desde
  `docs/assets/og-invitacion.html`.
- La tarjeta es **genérica** (no incluye empresa/tienda): el crawler no puede
  leer el token. La personalización viaja en el mensaje de WhatsApp que arma el
  panel del empresario.
- Si cambia el dominio público, actualiza las URLs absolutas de `src/index.html`
  y el valor por defecto de `PUBLIC_ORIGIN` en
  `scripts/generate-invitation-html.mjs`. También puedes definir
  `FRONTEND_URL` al ejecutar el build.

Para regenerar la imagen y comprobar el HTML:

```bash
cd frontend-app
npm run og-image
npm run build
grep -E 'og:(title|image)|twitter:card' dist/frontend-app/browser/invitacion.html
```

### CSP y el script inline de Angular (crítico)

> **Importante.** Angular inyecta un `<script>` inline (el _swap_ de CSS crítico
> de Beasties: `link[data-beasties-media].media = 'all'`) y sirve la hoja de
> estilos completa como `media="print"` hasta que ese script la activa. Con una
> CSP estricta (`script-src 'self'`, `R-SE-9`) ese script queda **bloqueado y la
> app se ve sin estilos**. La solución (sin `unsafe-inline`) es autorizarlo por
> **hash sha256**.

El hash vive en **tres** sitios y deben ir sincronizados:

1. `src/index.html` → `<meta http-equiv="Content-Security-Policy">` (afecta a
   todos los entornos; **es el que realmente bloquea**, porque se aplica en
   intersección con la cabecera).
2. `firebase.json` → cabecera CSP del sitio (este repo).
3. `nginx.conf` (raíz) → cabecera CSP de producción (Docker).

Si al actualizar Angular cambia ese snippet, recalcula el hash (el error de la
consola del navegador ya muestra el valor correcto) con:

```bash
cd frontend-app
npm run build
node -e "const c=require('crypto'),fs=require('fs');const h=fs.readFileSync('dist/frontend-app/browser/index.html','utf8');const s=[...h.matchAll(/<script>(document\.querySelectorAll[\s\S]*?)<\/script>/g)][0][1];console.log('sha256-'+c.createHash('sha256').update(s).digest('base64'))"
```

## 4. Comandos

```bash
cd frontend-app

# 1) Autenticación (una vez)
firebase login

# 2) Build + deploy al canal live: https://kb-coleccion-internacional-ni.web.app
npm run deploy

# 3) (Recomendado para staging) Preview channel temporal, sin tocar el live:
#    https://kb-coleccion-internacional-ni--staging-<hash>.web.app
npm run deploy:preview

# 4) Ver canales de preview activos
firebase hosting:channels:list
```

> Si el proyecto aún no tiene Hosting habilitado, entra una vez a **Firebase
> Console → Hosting → Get started** (crea el sitio por defecto) y luego despliega.

## 5. Límites del plan gratuito (Spark)

| Recurso                     | Incluido                     |
| --------------------------- | ---------------------------- |
| Almacenamiento              | 10 GB                        |
| Transferencia de datos      | **360 MB/día** (~10 GB/mes)  |
| Dominio propio + SSL        | Sí                           |
| Varios sitios por proyecto  | Sí                           |
| Cloud Functions / Cloud Run | **No** (requiere plan Blaze) |

El bundle inicial pesa ≈ **116 kB comprimidos**, así que el límite de transferencia
da de sobra para uso de staging/demo.

## 6. Verificaciones tras el despliegue (smoke, `R-CD-9`)

| #   | Comprobación                                                              | ☐   |
| --- | ------------------------------------------------------------------------- | --- |
| 1   | `curl -fsS https://<sitio>/` responde 200                                 | ☐   |
| 2   | La home carga el bundle inicial                                           | ☐   |
| 3   | Refrescar una ruta interna (`/tienda/<id>/shop`) no da 404 (fallback SPA) | ☐   |
| 4   | La app alcanza el API configurado (login funciona)                        | ☐   |
| 5   | `config.json` devuelve las URLs esperadas y sin cache                     | ☐   |
| 6   | El token no viaja en el bundle (`R-CD-2`)                                 | ☐   |

## 7. Rollback (`R-CD-5` / `R-CD-10`)

Firebase Hosting guarda **todo el historial de releases**:

1. **Console → Hosting → Release history** → elige la versión previa → **Rollback**.
2. O por CLI: `firebase hosting:rollback`.
3. Confirmar el smoke (§6).

## 8. Errores frecuentes

- **404 al refrescar rutas internas**: falta el `rewrite` de SPA en `firebase.json`.
- **La app sale sin estilos / violación de CSP en la consola**: el bloqueo del
  script inline de Beasties. Añade/actualiza el hash sha256 en las tres CSP
  (§3 "CSP y el script inline de Angular").
- **El frontend llama a un API vacío / error de CORS**: revisar `config.json` y
  que el origen `https://kb-coleccion-internacional-ni.web.app` esté en el CORS
  del backend.
- **404 u "Hosting not set up"**: habilita Hosting una vez en la Console.
- **El feature `/ia` no funciona**: es esperado en el plan gratuito; apunta
  `aiScraperUrl` a la URL pública del backend (con CORS) e introduce la API key
  en `/ia`. No intentes añadir Functions salvo que pases a Blaze.
- **No agregar el SDK web de Firebase** (el snippet `initializeApp` /
  `getAnalytics` de la Console): no es necesario para Hosting, y la CSP
  (`script-src 'self'`) **bloquearía** el import desde `gstatic.com`. Añadirlo
  solo si en el futuro se usan productos de Firebase (Auth/Firestore/…).
- **Assets con cache vieja tras deploy**: `index.html` debe ir sin cache; los
  assets llevan hash (`outputHashing: all`).
