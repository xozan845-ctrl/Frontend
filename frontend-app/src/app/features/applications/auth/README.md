# applications/auth/ — Experiencia de autenticación

Páginas de login, registro y recuperación, además de los guards e interceptores
que conectan la sesión con el router y HTTP. La sesión y las reglas de
autorización viven en `features/domains/session`.

- `pages/`: login, registro y recuperación.
- `guards/`: acceso por sesión, workspace, módulo y logística.
- `interceptors/`: token y refresh ante `401`.
- `auth.routes.ts`: rutas públicas de autenticación.
