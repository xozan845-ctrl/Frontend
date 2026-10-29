# Documentación — Quantum Store

Índice de la documentación del frontend. La documentación es parte del
entregable (`R-DO-*`): stack, decisiones, reglas y operación viven en el repo.

| Documento                                                  | Contenido                                                     |
| ---------------------------------------------------------- | ------------------------------------------------------------- |
| [`rules/README.md`](./rules/README.md)                     | Reglas de ingeniería, gobernanza y checklist de PR            |
| [`decisiones.md`](./decisiones.md)                         | ADRs: decisiones de arquitectura con contexto y consecuencias |
| [`workspaces-y-rls.md`](./workspaces-y-rls.md)             | Matriz de roles, scopes, permisos y RLS recomendada           |
| [`plantilla-adr.md`](./plantilla-adr.md)                   | Plantilla para registrar un ADR nuevo (`R-DO-2`)              |
| [`firebase-hosting-setup.md`](./firebase-hosting-setup.md) | Despliegue actual del frontend en Firebase Hosting            |
| [`dockploy-setup.md`](./dockploy-setup.md)                 | Destino futuro alternativo en Dockploy                        |
| [`assets/README.md`](./assets/README.md)                   | Assets de documentación (fuente de la imagen Open Graph)      |

## Reglas rápidas

- Un cambio de estructura o de comandos actualiza el README en el mismo PR
  (`R-DO-1`).
- Las reglas normativas viven en `docs/rules/`; los derivados en
  `docs/rules/_meta/` (`R-DO-6`).
- Cada directorio con contrato propio tiene su `README.md` (`R-DO-7`).
