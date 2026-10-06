# 02 — Entornos (Dockploy)

Reglas del despliegue físico en el VPS con Dockploy, compartido con el backend
Core Engine.

| ID      | Regla                                                                                                                                                                                                                                                                                                             |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-CD-6  | **Proyecto Dockploy propio**: el frontend vive en un proyecto Dockploy **con nombre propio** (p. ej. `frontend-ecomerce`), distinto del proyecto del backend Core Engine. No se mezclan servicios ni entornos de ambos repos en un mismo proyecto.                                                                |
| R-CD-7  | **Producción se despliega solo desde `main`**: el environment `produccion` apunta a la rama `main` y solo se redespliega por push a `main`, que por `R-GB-1` solo recibe merges de PR. Prohibido configurar un despliegue de producción desde otra rama o un webhook suelto.                                      |
| R-CD-8  | **Sin rama de staging por defecto**: el desarrollo es local y no se despliega (`R-GB-5`). Si se habilita un entorno `staging`, requiere decisión registrada en `decisiones.md`, apunta a una rama protegida concreta y sirve **el mismo build** (`R-CD-4`); no es una rama de larga vida creada por conveniencia. |
| R-CD-9  | **Smoke tras cada despliegue**: tras cada deploy, `curl -fsS https://<dominio>/` responde 200 y la home carga el catálogo (o al menos el bundle inicial). Sin smoke en verde, el despliegue se considera fallido y se activa el rollback.                                                                         |
| R-CD-10 | **Rollback en Dockploy**: un despliegue malo se revierte redesplegando la versión anterior en Dockploy (`R-CD-5`); después se corrige con una rama `fix/...` y PR a `main` (`R-GB-6`). Nunca se edita el servidor a mano.                                                                                         |

## Notas

- **Servido del artefacto**: el build estático de Angular se sirve con **nginx**
  en un contenedor (`Dockerfile` multi-stage versionado en la raíz del repo).
  `nginx.conf` sirve `dist/frontend-app/browser`, hace **fallback de rutas SPA**
  (`try_files $uri $uri/ /index.html`), añade las **cabeceras de seguridad**
  (incluida la CSP) y define las reglas de cache (assets con hash vs `index.html`
  y artefactos del service worker).
- **Puertos y red**: el contenedor del frontend solo publica el puerto del
  servidor web; no comparte red interna con los servicios del backend salvo lo
  estrictamente necesario.
