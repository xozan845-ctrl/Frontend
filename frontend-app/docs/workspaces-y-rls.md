# Workspaces, permisos y Row Level Security

Este documento fija la frontera de seguridad entre plataforma, empresa, tienda
y logística. El frontend solo evita navegación incoherente; la autorización
real debe ejecutarse en la API y en la base de datos.

## Invariantes del dominio

1. `super_admin` es propietario de la plataforma y de su infraestructura. Puede
   administrar tenants, usuarios, planes, facturación de plataforma, auditoría
   y configuración técnica. No es propietario de ninguna flota y no entra a
   logística global.
2. `empresario` es propietario de un `company_id` (`tenant_id`). Puede tener
   varias tiendas y vendedores, administrar el catálogo de empresa y su flota
   empresarial.
3. `vendedor` pertenece a un `company_id` y a una sola `store_id`. Puede operar
   absolutamente su tienda: pedidos, clientes, catálogo propio, ofertas de
   catálogo empresarial, facturación, roles de tienda y logística propia.
4. Un producto debe distinguir `owner_type = company | seller`. Un vendedor
   puede leer y ofertar productos de empresa, pero no modificar el producto
   maestro de la empresa.
5. Una flota tiene un único propietario: `logistics_owner_type = company` o
   `store`. El empresario administra la flota de empresa; el vendedor administra
   su flota de tienda. Si el vendedor usa la flota de empresa, puede operar
   rutas asignadas, pero no modificar la flota empresarial.
6. Ninguna tabla ni endpoint de negocio debe aceptar `platform` como propietario
   de logística. La plataforma puede auditar metadatos, no operar repartos.
7. El `id` UUID es una clave interna. Los slugs de empresa/tienda son nombres
   públicos y no conceden autorización; la API siempre resuelve y comprueba el
   tenant a partir del token.

## Mapa de superficies

| Superficie           | Ruta principal                                     | Actor                                 | Alcance                                        | Puede administrar logística |
| -------------------- | -------------------------------------------------- | ------------------------------------- | ---------------------------------------------- | --------------------------- |
| Plataforma           | `/admin/**`                                        | `super_admin`, `admin` delegado       | infraestructura, tenants, usuarios, auditoría  | No                          |
| Empresa              | `/empresa/**`                                      | `empresario`                          | un `tenant_id`, todas sus tiendas y vendedores | Flota `company`             |
| Tienda               | `/vendedor/**`                                     | `vendedor`                            | un `store_id` dentro de su empresa             | Flota `store`               |
| Logística contextual | `/empresa/logistica/**` o `/vendedor/logistica/**` | empresario/vendedor/personal asignado | empresa o tienda, nunca plataforma             | Según propietario           |
| Storefront           | `/tienda/:slug/**`                                 | público/comprador                     | lectura pública de una tienda                  | No                          |

`/logistica/**` se conserva solo como compatibilidad. El guard lo resuelve al
contexto de empresa o tienda y rechaza a usuarios de plataforma.

## Permisos

Los permisos se expresan como `dominio:acción` y se evalúan junto con el scope:

- Plataforma: `platform:manage-infrastructure`, `platform:manage-tenants`,
  `platform:manage-users`, `platform:manage-billing`, `platform:read-audit`.
- Empresa: `company:manage-stores`, `company:manage-sellers`,
  `company:manage-products`, `company:manage-roles`, `company:manage-billing`.
- Tienda: `store:manage`, `store:manage-products`, `store:manage-orders`,
  `store:manage-clients`, `store:manage-billing`, `store:manage-roles` y
  `store:manage-logistics`.
- Logística: `logistics:read`, `logistics:manage-fleet`,
  `logistics:manage-routes`, `logistics:manage-settings`.

Un permiso de tienda no permite cambiar el tenant, asignarse una empresa o
convertirse en `super_admin`. El endpoint que crea roles debe impedir siempre
la elevación de scope.

## RLS recomendado

Cada tabla protegida debe tener, como mínimo, `company_id` y cuando aplique
`store_id`. Las tablas logísticas agregan `logistics_owner_type` y una FK
exclusiva a `company_id` o `store_id`.

Al iniciar cada transacción autenticada, el API debe establecer variables de
sesión con valores validados por el JWT y no por parámetros del cliente:

```sql
select set_config('app.user_id',    :user_id,    true);
select set_config('app.role',       :role,       true);
select set_config('app.company_id', :company_id, true);
select set_config('app.store_id',   :store_id,   true);
```

Políticas mínimas:

```sql
-- Empresa: solo su propietario o un permiso explícito del tenant.
using (company_id = current_setting('app.company_id', true)::uuid
       and app_has_permission('company:read'))

-- Tienda: el vendedor solo ve su tienda; el empresario llega por endpoints
-- de empresa que resuelven las tiendas de su tenant.
using (store_id = current_setting('app.store_id', true)::uuid
       and app_has_permission('store:read'))

-- Productos: vendedor lee catálogo de empresa, pero solo muta sus productos.
using (owner_type = 'company' and company_id = app_company_id()
       or owner_type = 'seller' and owner_user_id = app_user_id())
with check (owner_type = 'seller' and owner_user_id = app_user_id());

-- Flota: nunca existe una política platform.
using ((logistics_owner_type = 'company'
        and company_id = app_company_id()
        and app_has_permission('logistics:manage-fleet'))
    or (logistics_owner_type = 'store'
        and store_id = app_store_id()
        and app_has_permission('logistics:manage-fleet')));
```

El `super_admin` debe acceder a datos de negocio mediante endpoints de soporte
con auditoría explícita (`platform:read` + motivo/trace id), no saltándose RLS
con un usuario de aplicación compartido. Las mutaciones de logística deben
rechazar cualquier `logistics_owner_type = 'platform'` antes de llegar a la
base de datos.

## Validaciones obligatorias de API

- Ignorar o rechazar `company_id`, `store_id`, `owner_user_id` y permisos que
  lleguen del body cuando contradigan el token.
- Verificar que una tienda pertenece al tenant antes de asignarla a un
  vendedor.
- Verificar que un vendedor solo tenga una tienda activa.
- Al crear un rol, limitar sus permisos al conjunto permitido por el actor y
  registrar quién lo creó, cuándo y sobre qué `store_id`.
- No aceptar un vendedor sin `tenant_id` ni `store_id` para endpoints de tienda.
- No aceptar personal logístico sin tenant y asignación de empresa/tienda.
- Auditar altas, cambios de permisos, cambios de propietario de flota y
  eliminación lógica de recursos.

## Implementación actual del frontend

`auth/models/authorization.model.ts` centraliza la matriz, `workspaceGuard`
protege rutas transversales y `logisticsGuard` bloquea logística de plataforma.
El adapter de sesión conserva `tenantId`, `storeId`, permisos delegados y
`logisticsOwnership`. Estos datos sirven para navegación y UX; nunca sustituyen
las políticas RLS del backend.

## Pendientes de backend antes de producción

1. Emitir `store_id`, permisos efectivos y ownership logístico en `/auth/me`,
   login y refresh.
2. Crear tablas de membresía/roles de tienda y políticas RLS de empresa,
   tienda, producto, pedido y logística.
3. Separar endpoints de plataforma de endpoints de empresa/tienda; retirar la
   semántica ambigua de `/logistica` global.
4. Añadir pruebas negativas de integración: cross-tenant, cross-store,
   vendedor modificando producto de empresa y superadmin intentando mutar una
   flota.
