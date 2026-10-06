# Reglas de CD (Continuous Deployment) — frontend-ecomerce

Entrega del frontend en **Dockploy**, el mismo VPS que sirve el backend Core
Engine. Cómo se construye la SPA, qué se despliega y cómo se revierte.

> **Estado:** el repo no tiene aún `Dockerfile`, `nginx.conf` ni configuración de
> Dockploy; estas reglas son el **contrato** del despliegue. El guion operativo
> vive en [`../../dockploy-setup.md`](../../dockploy-setup.md).

## Archivos

| Archivo            | Contenido                                                                                    | IDs           |
| ------------------ | -------------------------------------------------------------------------------------------- | ------------- |
| `01-despliegue.md` | Build estático reproducible, sin secretos, versionado por tag y rollback                     | `R-CD` (1–5)  |
| `02-entornos.md`   | Proyecto Dockploy, environment `produccion` desde `main`, staging opcional, smoke y rollback | `R-CD` (6–10) |

> El modelo de ramas que estos despliegues consumen vive en
> [`../git/00-flujo.md`](../git/00-flujo.md) (`R-GB-*`).

## Guía rápida

| Etapa      | Rama (R-GB)      | Dónde corre                        | Cómo llega                       |
| ---------- | ---------------- | ---------------------------------- | -------------------------------- |
| Desarrollo | ramas `tipo/...` | **local** (`npm start`)            | PR de feature; sin despliegue    |
| Producción | `main`           | Dockploy, environment `produccion` | merge de PR (`R-GB-1`, `R-CD-7`) |

## Cómo verificar

```bash
npm run build                                  # artefacto production en dist/frontend-app/browser
curl -fsS https://<dominio-prod>/              # smoke del sitio (R-CD-9)
```
