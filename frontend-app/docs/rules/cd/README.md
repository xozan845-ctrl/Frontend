# Reglas de CD (Continuous Deployment) — frontend-ecomerce

Entrega del frontend en **Firebase Hosting**. Cómo se construye la SPA, qué se
despliega y cómo se revierte.

> **Estado:** Firebase Hosting es el destino actual de producción. El repo
> incluye `firebase.json`, `.firebaserc` y `deploy-firebase.yml`, que ejecuta
> gates propios, build, deploy y smoke en cada push a `main` o disparo manual.
> Si falta `FIREBASE_SERVICE_ACCOUNT`, el deploy y su smoke se omiten con aviso.
> `firebase-hosting-smoke.yml` permite además un smoke manual o por
> `repository_dispatch`; no se dispara automáticamente desde el workflow de deploy.
> `Dockerfile`/`nginx.conf` se conservan como artefactos alternos;
> Dockploy no forma parte de la operación actual. El guion operativo vive en
> [`../../firebase-hosting-setup.md`](../../firebase-hosting-setup.md).

## Archivos

| Archivo            | Contenido                                                                              | IDs           |
| ------------------ | -------------------------------------------------------------------------------------- | ------------- |
| `01-despliegue.md` | Build estático reproducible, sin secretos, versionado por tag y rollback               | `R-CD` (1–5)  |
| `02-entornos.md`   | Proyecto Firebase Hosting, producción desde `main`, staging opcional, smoke y rollback | `R-CD` (6–10) |

> El modelo de ramas que estos despliegues consumen vive en
> [`../git/00-flujo.md`](../git/00-flujo.md) (`R-GB-*`).

## Guía rápida

| Etapa      | Rama (R-GB)      | Dónde corre                  | Cómo llega                                |
| ---------- | ---------------- | ---------------------------- | ----------------------------------------- |
| Desarrollo | ramas `tipo/...` | **local** (`npm start`)      | PR de feature; sin despliegue             |
| Producción | `main`           | Firebase Hosting, sitio live | merge de PR + deploy (`R-GB-1`, `R-CD-7`) |

## Cómo verificar

```bash
npm run build                                  # artefacto production en dist/frontend-app/browser
FRONTEND_URL=https://<dominio-prod> npm run hosting:smoke  # smoke del sitio (R-CD-9)
```
