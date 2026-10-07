# frontend-ecomerce

Repositorio del **frontend** del e-commerce («Quantum Store»): una SPA **Angular 22**
(NgRx Signals + Tailwind 4 + Vitest/Playwright) que vive en [`frontend-app/`](./frontend-app)
y se sirve con nginx (Docker) en Dockploy.

## Enlaces

- **Aplicación y guía de desarrollo:** [`frontend-app/README.md`](./frontend-app/README.md)
- **Reglas del proyecto (punto fijo):** [`frontend-app/docs/rules/README.md`](./frontend-app/docs/rules/README.md)
- **Decisiones de arquitectura (ADR):** [`frontend-app/docs/decisiones.md`](./frontend-app/docs/decisiones.md)
- **Estado y auditoría:** [`frontend-app/docs/rules/_meta/AUDIT.md`](./frontend-app/docs/rules/_meta/AUDIT.md)
- **Despliegue (Docker + nginx + Dockploy):** [`frontend-app/docs/dockploy-setup.md`](./frontend-app/docs/dockploy-setup.md)

## Estructura del código

`frontend-app/src/app/` sigue la estructura enterprise `core/ · shared/ · layout/ ·
features/` (ADR-12): infraestructura transversal, presentación reutilizable, chrome
de la app y dominios de negocio con clean/hexagonal interno.
