# Contrato backend — Media Background (plataforma, empresa y tienda)

> **Estado:** implementado por el backend en `develop` (2026-11-04). Pendiente
> de despliegue en **stage**; Dockploy devuelve `404 Compose Not Found`.
> **Fecha de la propuesta:** 2026-11-03.
> **Consumidor:** frontend `frontend-ecomerce` (Angular), inicialmente la página
> `features/applications/home/pages/store-entry` («Elige tu tienda»).
>
> **Frontend:** el dominio `features/domains/media-background` normaliza la
> respuesta, y `shared/ui/media-background` renderiza imagen o video. Si el
> endpoint no está disponible (por ejemplo, stage sin desplegar), el store
> registra el error y la página conserva su fondo por defecto sin romperse.

## 1. Diagnóstico original (2026-11-03)

> La tabla siguiente refleja el estado **previo** a la implementación. El
> backend ya incorporó este contrato en `develop`; ver el estado al inicio.

Revisado el OpenAPI público y el código de `core-engine` (rama `staging`):

| Capacidad                                      | ¿Existe? | Evidencia                                                                     |
| ---------------------------------------------- | -------- | ----------------------------------------------------------------------------- |
| Logo de empresa (`logo_objeto_id`, `logo_url`) | Sí       | `identity-service/src/empresas/empresas.controller.ts`, `empresas.service.ts` |
| Logo de tienda (`logo_objeto_id`, `logo_url`)  | Sí       | `stores-service/src/tiendas/tiendas.response.dto.ts`, `tiendas.controller.ts` |
| Imágenes de producto                           | Sí       | `catalog` + `ImagenProductoRequestDto`                                        |
| Imagen/video de fondo para **empresa**         | **No**   | `EmpresaResponseDto` y `PerfilEmpresaRequestDto` no tienen campos de fondo    |
| Imagen/video de fondo para **tienda**          | **No**   | `TiendaResponseDto` y `PATCH /tiendas/{id}/logo` solo cubren logo             |
| Imagen/video de fondo para **plataforma**      | **No**   | No existe endpoint de configuración global del sitio                          |
| Servir **video** desde storage público         | **No**   | `objetos.service.ts` exige `content_type.startsWith('image/')`                |
| Soportar `Range` para video                    | **No**   | `public.controller.ts` no lee `Range` ni responde `206`                       |
| Aceptar videos en la whitelist de subida       | **No**   | `STORAGE_CONTENT_TYPES_DEFAULT` solo contiene imágenes/PDF/CSV/texto          |

**Conclusión original:** el backend todavía no soportaba media background para
plataforma, empresa ni tienda. El contrato de este documento se implementó en
`develop`; falta desplegarlo a stage. El frontend no hardcodea ni inventa URLs:
consume `background_url`/`background_poster_url` y las resuelve contra el API.

---

## 2. Modelo común (aplicable a los tres ámbitos)

Se reutiliza el mismo conjunto de campos en las tres respuestas. Los binarios
viven en `storage-service`; cada servicio de dominio solo guarda **ids** y
metadatos. **Nunca se guardan URLs firmadas ni URLs absolutas.**

### 2.1 Campos de respuesta

| Campo                         | Tipo                    | Nulo | Origen                | Descripción                                                                                      |
| ----------------------------- | ----------------------- | ---- | --------------------- | ------------------------------------------------------------------------------------------------ |
| `background_objeto_id`        | `uuid`                  | Sí   | Persistido            | Objeto de storage del fondo. `null` = sin fondo.                                                 |
| `background_media_type`       | `"imagen"` \| `"video"` | Sí   | Derivado en escritura | Tipo real del objeto, calculado por el backend desde `content_type`. **No lo envía el cliente.** |
| `background_url`              | `string`                | Sí   | Derivado              | `/api/v1/storage/public/objetos/{background_objeto_id}`. **No se persiste.**                     |
| `background_poster_objeto_id` | `uuid`                  | Sí   | Persistido            | Imagen de portada para video. Obligatoria recomendada cuando hay video.                          |
| `background_poster_url`       | `string`                | Sí   | Derivado              | `/api/v1/storage/public/objetos/{background_poster_objeto_id}`. **No se persiste.**              |
| `background_alt`              | `string`                | No   | Persistido            | Texto alternativo/decorativo. `''` por defecto. Máx. 160.                                        |
| `background_overlay`          | `number`                | No   | Persistido            | Opacidad del velo oscuro, `0`–`100`. Por defecto `35`.                                           |
| `background_position`         | `string`                | No   | Persistido            | `center` \| `top` \| `bottom` \| `left` \| `right`. Por defecto `center`.                        |
| `background_activo`           | `boolean`               | No   | Persistido            | Si el fondo debe mostrarse. Por defecto `false`.                                                 |

### 2.2 Reglas de escritura

1. El cliente sube el archivo con el flujo existente de storage:
   `POST /api/v1/storage/subidas` con `publico: true` → `PUT` a la URL
   prefirmada → `POST /api/v1/storage/objetos/{id}/confirmar`.
2. El cliente envía **solo ids** al endpoint de dominio. Nunca envía
   `background_url` ni `background_media_type`.
3. El backend valida el objeto contra storage interno:
   - mismo `tenant_id` que el ámbito (empresa/tienda) o el tenant de plataforma;
   - `estado === "activo"`;
   - `publico === true`;
   - `content_type` permitido: `image/jpeg`, `image/png`, `image/webp`,
     `video/mp4`, `video/webm`.
4. El backend deriva `background_media_type`:
   - `image/*` → `imagen`;
   - `video/*` → `video`;
   - cualquier otro → `400 BACKGROUND_INVALIDO`.
5. Si hay video, `background_poster_objeto_id` debe ser una **imagen** pública,
   activa y del mismo tenant. Se recomienda exigirlo para evitar un primer frame
   en blanco; si se deja opcional, el frontend usará un degradado de respaldo.
6. Semántica de actualización parcial:
   - campo ausente (`undefined`) = no cambiar;
   - `background_objeto_id: null` = limpiar todo el fondo
     (`background_media_type`, `background_url`, poster, alt, overlay,
     position y `background_activo = false`);
   - `background_objeto_id` nuevo = validar y reemplazar.
7. Al reemplazar un fondo no es necesario borrar el objeto anterior de storage
   en la misma transacción; puede quedar huérfano y limpiarse con una tarea
   aparte. Lo importante es que la respuesta nunca apunte a un objeto inválido.

### 2.3 Decisión obligatoria: tenant dueño de los assets de plataforma

`storage-service` es multi-tenant y el objeto debe pertenecer a un tenant.
Para la plataforma no existe hoy un tenant global documentado. El backend debe
definir uno de estos caminos y documentarlo:

- **Recomendado:** configurar `PLATFORM_TENANT_ID` (UUID) en identity-service y
  usarlo para validar las subidas de plataforma. El admin de plataforma sube el
  archivo a ese tenant.
- Alternativa: añadir un ámbito `plataforma` a `storage.objetos` con
  `tenant_id` nulo y reglas propias (más invasivo; no se recomienda para v1).

Sin esta decisión, el backend no puede validar ni servir el fondo de plataforma
de forma segura.

---

## 3. Plataforma

### 3.1 Migración

Nuevo archivo `infra/db/init/16_media_background.sql` (o el siguiente número
libre):

```sql
BEGIN;

CREATE TABLE IF NOT EXISTS identity.configuracion_plataforma (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  background_objeto_id uuid,
  background_media_type text CHECK (background_media_type IN ('imagen', 'video')),
  background_poster_objeto_id uuid,
  background_alt text NOT NULL DEFAULT '',
  background_overlay smallint NOT NULL DEFAULT 35
    CHECK (background_overlay BETWEEN 0 AND 100),
  background_position text NOT NULL DEFAULT 'center'
    CHECK (background_position IN ('center', 'top', 'bottom', 'left', 'right')),
  background_activo boolean NOT NULL DEFAULT false,
  actualizado_por uuid,
  actualizado_en timestamptz NOT NULL DEFAULT NOW()
);

INSERT INTO identity.configuracion_plataforma (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

COMMIT;
```

### 3.2 Endpoints nuevos

| Método  | Ruta                          | Auth                    | Descripción                                 |
| ------- | ----------------------------- | ----------------------- | ------------------------------------------- |
| `GET`   | `/api/v1/configuracion/sitio` | Pública                 | Configuración visible del sitio (branding). |
| `PATCH` | `/api/v1/configuracion/sitio` | `super_admin` / `admin` | Actualizar fondo y metadatos.               |

Implementación sugerida: nuevo módulo
`packages/identity-service/src/configuracion-sitio/`
(`configuracion-sitio.controller.ts`, `.service.ts`, `.response.dto.ts`).

`GET` debe ser cacheable (`Cache-Control: public, max-age=60`) y no requiere
Bearer. `PATCH` usa `@Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)`.

### 3.3 Request

```json
{
  "background_objeto_id": "8f0c0f0e-...",
  "background_poster_objeto_id": "1a2b3c4d-...",
  "background_alt": "Colección internacional",
  "background_overlay": 40,
  "background_position": "center",
  "background_activo": true
}
```

Todos los campos son opcionales en el `PATCH`. Para quitar el fondo:

```json
{ "background_objeto_id": null }
```

### 3.4 Response

```json
{
  "background_objeto_id": "8f0c0f0e-...",
  "background_media_type": "video",
  "background_url": "/api/v1/storage/public/objetos/8f0c0f0e-...",
  "background_poster_objeto_id": "1a2b3c4d-...",
  "background_poster_url": "/api/v1/storage/public/objetos/1a2b3c4d-...",
  "background_alt": "Colección internacional",
  "background_overlay": 40,
  "background_position": "center",
  "background_activo": true,
  "actualizado_en": "2026-11-03T18:00:00.000Z"
}
```

Sin fondo: todos los ids/URLs y `background_media_type` en `null`,
`background_alt` en `""`, `background_overlay` en `35`,
`background_position` en `"center"` y `background_activo` en `false`.

---

## 4. Empresa

### 4.1 Migración

```sql
ALTER TABLE identity.empresas
  ADD COLUMN IF NOT EXISTS background_objeto_id uuid,
  ADD COLUMN IF NOT EXISTS background_media_type text
    CHECK (background_media_type IN ('imagen', 'video')),
  ADD COLUMN IF NOT EXISTS background_poster_objeto_id uuid,
  ADD COLUMN IF NOT EXISTS background_alt text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS background_overlay smallint NOT NULL DEFAULT 35
    CHECK (background_overlay BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS background_position text NOT NULL DEFAULT 'center'
    CHECK (background_position IN ('center', 'top', 'bottom', 'left', 'right')),
  ADD COLUMN IF NOT EXISTS background_activo boolean NOT NULL DEFAULT false;
```

### 4.2 Endpoint existente a extender

`PATCH /api/v1/empresas/{id}/perfil` — mismos permisos actuales (empresario
dueño, admin o super_admin).

**Archivos:**

- `packages/identity-service/src/empresas/empresas.controller.ts`
  - extender `PerfilEmpresaRequestDto` con los campos de escritura;
  - extender `EmpresaResponseDto` con los campos de respuesta.
- `packages/identity-service/src/empresas/empresas.service.ts`
  - extender `Empresa`, `PerfilEmpresaInput`, `normalizarPerfil`,
    `validarPerfil`, `UPDATE` y `conLogoUrl`/mapeo de respuesta;
  - reutilizar el patrón de `validarLogo` para validar el fondo;
  - derivar `background_url` y `background_poster_url` con el mismo patrón que
    `logo_url`.

**Response (fragmento):**

```json
{
  "id": "empresa-uuid",
  "nombre": "Distribuidora Piloto",
  "logo_objeto_id": null,
  "logo_url": null,
  "background_objeto_id": "uuid",
  "background_media_type": "imagen",
  "background_url": "/api/v1/storage/public/objetos/uuid",
  "background_poster_objeto_id": null,
  "background_poster_url": null,
  "background_alt": "",
  "background_overlay": 35,
  "background_position": "center",
  "background_activo": true
}
```

**Opcional recomendado:** si el fondo de empresa debe verse en páginas públicas
sin sesión, añadir `GET /api/v1/empresas/{id}/branding` (público) que devuelva
solo `id`, `nombre`, `slug`, `logo_url` y los campos `background_*`. No exponer
el resto del perfil.

---

## 5. Tienda

### 5.1 Migración

```sql
ALTER TABLE stores.tiendas
  ADD COLUMN IF NOT EXISTS background_objeto_id uuid,
  ADD COLUMN IF NOT EXISTS background_media_type text
    CHECK (background_media_type IN ('imagen', 'video')),
  ADD COLUMN IF NOT EXISTS background_poster_objeto_id uuid,
  ADD COLUMN IF NOT EXISTS background_alt text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS background_overlay smallint NOT NULL DEFAULT 35
    CHECK (background_overlay BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS background_position text NOT NULL DEFAULT 'center'
    CHECK (background_position IN ('center', 'top', 'bottom', 'left', 'right')),
  ADD COLUMN IF NOT EXISTS background_activo boolean NOT NULL DEFAULT false;
```

### 5.2 Endpoint nuevo

`PATCH /api/v1/tiendas/{id}/background`

- **Auth:** misma regla que `PATCH /api/v1/tiendas/{id}/logo`: vendedor dueño
  de la tienda, empresario de la empresa o admin.
- **Body:** mismos campos que plataforma/empresa (solo ids + metadatos).
- **Response:** `TiendaResponseDto` completo con los campos `background_*`.

**Archivos:**

- `packages/stores-service/src/tiendas/tiendas.response.dto.ts`
  - añadir los campos de respuesta.
- `packages/stores-service/src/tiendas/tiendas.controller.ts`
  - nuevo DTO `ActualizarBackgroundTiendaRequestDto`;
  - nuevo handler `PATCH :id/background`.
- `packages/stores-service/src/tiendas/tiendas.service.ts`
  - extender `Tienda`, `CAMPOS_TIENDA`, `buscarPorIdentificador`, `conLogoUrl`
    (o crear `conBackgroundUrls`);
  - reutilizar `validarLogo` como `validarMediaPublico` con tipos permitidos.

El endpoint público existente `GET /api/v1/tiendas/{id}` debe devolver los
campos `background_*` automáticamente, porque usa `TiendaResponseDto`.

---

## 6. Storage: cambios imprescindibles

### 6.1 Whitelist de content-types

En `packages/shared/src/constants.ts`:

```ts
export const STORAGE_CONTENT_TYPES_DEFAULT = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'video/mp4',
  'video/webm',
  'application/pdf',
  'text/csv',
  'text/plain',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/json',
] as const;
```

Actualizar también `.env.example`, `.env.stage.example` y
`.env.production.example` si usan `STORAGE_CONTENT_TYPES_PERMITIDOS`.

**Formatos recomendados:** MP4 con H.264/AAC (máxima compatibilidad) y WebM
como alternativa. No aceptar SVG (riesgo de scripts) ni formatos ambiguos.

### 6.2 Límite de tamaño

Hoy `STORAGE_MAX_OBJETO_BYTES_DEFAULT` es 25 MiB. Un video de fondo puede
superarlo. Dos opciones:

- **Recomendada:** añadir `STORAGE_MAX_VIDEO_BYTES` (por defecto 100 MiB) y
  validar por tipo: imágenes 25 MiB, videos 100 MiB.
- Mínimo: subir el límite global a 100 MiB y documentarlo.

La respuesta de `POST /api/v1/storage/subidas` debe devolver `max_bytes`
coherente con el tipo solicitado.

### 6.3 Servir video y soportar `Range`

**Archivos:** `packages/storage-service/src/objetos/objetos.service.ts`,
`public.controller.ts`, `packages/shared/src/storage/almacen.contracts.ts` y
`packages/storage-service/src/almacen/minio.almacen.ts`.

Cambios:

1. `leerPublico` debe aceptar `image/*` **y** `video/*` (seguir rechazando
   `image/svg+xml`).
2. Añadir al puerto `AlmacenObjetos` una lectura por rango:
   ```ts
   leerRango(
     bucket: string,
     objeto: string,
     inicio: number,
     fin: number,
   ): Promise<ObjetoLeido | null>;
   ```
   En MinIO usar `getPartialObject(bucket, objeto, inicio, fin - inicio + 1)`.
3. `PublicStorageController` debe:
   - leer la cabecera `Range` (`bytes=inicio-fin`, `bytes=inicio-`,
     `bytes=-sufijo`);
   - responder `206 Partial Content` con `Content-Range: bytes inicio-fin/total`
     y `Content-Length` parcial;
   - responder `416 Range Not Satisfiable` con `Content-Range: bytes */total`
     si el rango es inválido;
   - añadir siempre `Accept-Ranges: bytes`;
   - mantener `Content-Type`, `Cache-Control: public, max-age=31536000, immutable`,
     `X-Content-Type-Options: nosniff` y `Content-Disposition: inline`;
   - soportar `HEAD` (recomendado para que el navegador conozca el tamaño).
4. Actualizar Swagger:
   - `200` con `image/*` y `video/*`;
   - `206` documentado;
   - `404` para «inexistente, privado, eliminado o tipo no permitido».

Sin `Range`, el video puede reproducirse, pero no buscar/seek ni servir bien en
Safari/iOS. Por eso es requisito, no extra.

### 6.4 Validación interna reutilizable

Empresa y tienda ya validan logos con:

```text
GET {STORAGE_SERVICE_URL}/internal/storage/objetos/{id}?tenant_id={tenantId}
Header: x-internal-key
```

Para el fondo, validar además `content_type`:

```ts
const esImagen = content_type.startsWith('image/');
const esVideo = content_type === 'video/mp4' || content_type === 'video/webm';
if (!esImagen && !esVideo) throw new DomainError('BACKGROUND_INVALIDO', ...);
```

Mantener `estado === 'activo'`, `publico === true` y `tenant_id` correcto.

---

## 7. Ejemplos de integración para el frontend

El frontend normalizará la respuesta a un modelo como este:

```ts
interface MediaBackgroundConfig {
  mediaType: 'imagen' | 'video' | null;
  url: string | null;
  posterUrl: string | null;
  alt: string;
  overlay: number;
  position: 'center' | 'top' | 'bottom' | 'left' | 'right';
  active: boolean;
}
```

- `background_url` y `background_poster_url` son **rutas relativas**; el
  frontend las resolverá con `resolveStorageAssetUrl`.
- El componente aplicará `autoplay`, `muted`, `loop`, `playsinline` y
  `preload="metadata"` para video.
- Si `background_media_type === 'video'` y no hay poster, el frontend mostrará
  un degradado de respaldo.
- Si el usuario tiene `prefers-reduced-motion: reduce`, el frontend pausará el
  video y mostrará el poster o el degradado. Esto es decisión del cliente, no
  requiere campo en la API.

---

## 8. Criterios de aceptación (tests que debe incluir el backend)

### Storage

- [ ] `POST /api/v1/storage/subidas` acepta `video/mp4` y `video/webm`.
- [ ] Rechaza un video que excede el límite con un error claro.
- [ ] `GET /api/v1/storage/public/objetos/{id}` sirve una imagen con `200`.
- [ ] Sirve un video con `200`, `Content-Type: video/mp4` y `Accept-Ranges: bytes`.
- [ ] Con `Range: bytes=0-1023` responde `206`, `Content-Range` y 1024 bytes.
- [ ] Con un rango inválido responde `416`.
- [ ] Un objeto privado, eliminado, de otro tenant o SVG responde `404`.

### Plataforma

- [ ] `GET /api/v1/configuracion/sitio` es público y devuelve el fondo activo.
- [ ] `PATCH /api/v1/configuracion/sitio` exige admin/super_admin.
- [ ] Rechaza objeto de otro tenant, privado, inactivo o MIME no permitido.
- [ ] `background_objeto_id: null` limpia todos los campos.
- [ ] `background_url` se deriva del id; no se acepta desde el cliente.

### Empresa

- [ ] `PATCH /empresas/{id}/perfil` acepta imagen y video.
- [ ] `EmpresaResponseDto` incluye `background_media_type`, `background_url`,
      poster y metadatos.
- [ ] Un usuario ajeno a la empresa recibe `403`.
- [ ] El fondo no rompe el flujo actual de logo.

### Tienda

- [ ] `PATCH /tiendas/{id}/background` funciona para dueño/empresario/admin.
- [ ] `GET /tiendas/{id}` (público) devuelve los campos `background_*`.
- [ ] Un objeto de otra empresa/tenant se rechaza.
- [ ] El flujo actual `PATCH /tiendas/{id}/logo` sigue funcionando.

### OpenAPI

- [ ] El contrato exportado incluye los nuevos endpoints, DTOs, `206` y `video/*`.
- [ ] No hay URLs firmadas en las respuestas de dominio.

---

## 9. Orden de implementación sugerido

1. **Storage** (whitelist + límite + `Range` + servir video). Es el bloqueo
   principal y se puede probar de forma aislada.
2. **Plataforma** (`configuracion_plataforma` + endpoints + tenant de
   plataforma). Es el caso de uso inicial de «Elige tu tienda».
3. **Empresa** (columnas + DTOs + validación + respuesta).
4. **Tienda** (columnas + endpoint + respuesta pública).
5. **OpenAPI + tests** de los tres ámbitos.
6. Avisar al frontend con el contrato final para integrar el componente
   `shared/ui/media-background`.

## 10. Fuera de alcance de esta v1

- Variantes de fondo por breakpoint (`desktop`/`mobile`). Si se necesitan, se
  pueden añadir después con sufijo `_movil` y la misma validación.
- Edición/recorte de video en servidor.
- Múltiples fondos por entidad o rotación/carrusel.
- Fondo por sucursal o por categoría.
- Conversión automática de video a H.264/WebM.
- CDN dedicada; el endpoint público actual ya es cacheable e inmutable.
