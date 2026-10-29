# 02 — Entornos (Firebase Hosting)

Reglas del despliegue del sitio estático en Firebase Hosting. El frontend y el
backend mantienen despliegues independientes.

| ID      | Regla                                                                                                                                                                                                                                                                                                             |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-CD-6  | **Proyecto Firebase Hosting propio**: el frontend vive en el proyecto Firebase configurado en `.firebaserc`, separado del proyecto y despliegue del backend Core Engine. No se mezclan credenciales ni entornos de ambos repositorios.                                                                            |
| R-CD-7  | **Producción se despliega solo desde `main`**: el sitio live se publica con el artefacto construido desde `main`, que por `R-GB-1` solo recibe merges de PR. Los previews pueden salir de ramas mediante `npm run deploy:preview`.                                                                                |
| R-CD-8  | **Sin rama de staging por defecto**: el desarrollo es local y no se despliega (`R-GB-5`). Si se habilita un entorno `staging`, requiere decisión registrada en `decisiones.md`, apunta a una rama protegida concreta y sirve **el mismo build** (`R-CD-4`); no es una rama de larga vida creada por conveniencia. |
| R-CD-9  | **Smoke tras cada despliegue**: tras cada deploy, `firebase-hosting-smoke.yml` ejecuta `scripts/commands/hosting-smoke.mjs` y valida shell, ruta SPA y `/config.json`. Sin smoke en verde, el despliegue se considera fallido.                                                                                    |
| R-CD-10 | **Rollback en Firebase Hosting**: un despliegue malo se revierte desde el historial de releases de Firebase Hosting (`R-CD-5`); después se corrige con una rama `fix/...` y PR a `main` (`R-GB-6`). Nunca se edita el sitio manualmente.                                                                          |

## Notas

- **Servido del artefacto**: Firebase Hosting sirve `dist/frontend-app/browser`
  según `firebase.json`, aplica el rewrite SPA a `/index.html`, las cabeceras de
  seguridad y las reglas de caché.
- **Separación de servicios**: el frontend llama al gateway público configurado;
  Firebase Hosting no comparte red privada ni credenciales con el backend.
