# core/workspace/ — Registro de módulos y navegación

Registro único de los módulos del workspace y de su visibilidad por sesión.
No contiene lógica de negocio ni componentes de UI.

| Unidad       | Responsabilidad                                                       |
| ------------ | --------------------------------------------------------------------- |
| `models/`    | `WorkspaceModule`, secciones, estado y `WorkspaceScope`.              |
| `constants/` | `WORKSPACE_MODULES`, etiquetas de sección y agrupación por workspace. |

## Cómo funciona

1. Cada módulo declara `workspace`, `permission` y `section`.
2. El shell inyecta `AuthStore` y construye los grupos con
   `workspaceModuleGroups(workspace, canView)`.
3. `canView` comprueba `canEnterWorkspace(...)` + `hasPermission(...)`.
4. El sidebar solo pinta los grupos recibidos; no conoce roles ni rutas
   hardcodeadas.
5. `moduleGuard(id)` en `features/applications/auth` resuelve el acceso a la ruta con el
   mismo registro (importado de forma lazy).

## Añadir un módulo

- Añadir la entrada a `WORKSPACE_MODULES` con `id`, metadatos, `workspace`,
  `permission` y `status`.
- Añadir el permiso a `Permission` y a los roles que correspondan en
  `features/applications/auth/models/authorization.model.ts`.
- Proteger la ruta con `moduleGuard('id')`.
- Los módulos `soon` se muestran igual, pero responden con la página de
  “En construcción” hasta su implementación.

La autorización real sigue en el backend/RLS: ocultar un módulo en la UI es
UX, no una frontera de seguridad.
