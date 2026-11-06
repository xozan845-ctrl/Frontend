# domains/session/ — Sesión y autorización

Dominio transversal de la sesión autenticada y las reglas de autorización por
workspace. No contiene páginas ni guards de Angular Router; la experiencia de
login/registro vive en `features/applications/auth`.

- `models/auth.model.ts`: usuario, roles y contratos de login/registro.
- `models/authorization.model.ts`: permisos, workspaces y `workspaceLanding`.
- `adapters/`: normalización de respuestas de identidad.
- `repositories/`: puerto `AUTH_REPOSITORY`.
- `services/`: implementación HTTP/mock.
- `state/`: `AuthStore` con sesión, refresh y persistencia.

Regla: los dominios consumen esta API pública directamente; no importan
`features/applications/auth`.
