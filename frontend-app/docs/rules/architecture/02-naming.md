# 02 — Nomenclatura

Aplica a: nombres de archivos, carpetas, clases, selectores, tipos, claves de
almacenamiento y mensajes de commit en `frontend-app/`.

## Archivos y carpetas

| ID     | Regla                                                                                                                                                                                                                                                                                                                                                                               |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-NC-1 | **Archivos `kebab-case` con sufijo por tipo**: `[nombre].[tipo].ts` (el tipo separado por punto). Tipos: `component`, `service`, `store`, `adapter`, `repository`, `model`, `dto`, `guard`, `interceptor`, `directive`, `pipe`, `mock`, `constants`, `spec`. Ejemplos: `product-list.component.ts`, `product.store.ts`, `auth.adapter.ts`, `auth.guard.ts`, `coupons.constants.ts`. |
| R-NC-2 | **Plantillas y estilos por archivo**: cada componente declara `templateUrl: './<nombre>.component.html'` y `styleUrl(s)` en archivos hermanos con el mismo `[nombre]`; prohibido incrustar plantillas o estilos largos en el decorador.                                                                                                                                             |
| R-NC-3 | **Carpetas `kebab-case`** en singular o plural coherente con el dominio (`features/products`, `features/products/pages/product-list`, `shared/ui/product-carousel`, `core/services`, `layout/navbar`).                                                                                                                                                                              |

## Clases, tipos y selectores

| ID     | Regla                                                                                                                                                                                                                                                                                     |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-NC-4 | **Clases en `PascalCase` con sufijo por tipo**: `ProductListComponent`, `ProductService`, `ProductStore`, `AuthGuard`, `SeoService`. Las interfaces de dominio **no** llevan prefijo `I` (`Product`, `AuthRepository`).                                                                   |
| R-NC-5 | **Selectores de componente `app-` + `kebab-case`** (`app-product-card`, `app-cart-sidebar`); directivas con prefijo `app` en atributo (`[appScrollReveal]`) o camelCase si el selector es de elemento.                                                                                    |
| R-NC-6 | **Variables y funciones `camelCase`**; constantes y claves de configuración `UPPER_SNAKE_CASE` (`MAX_ITEMS`, `AUTH_STORAGE_KEY`, `DEFAULT_API_CONFIG`). Prohibido `Spanglish` en el mismo símbolo (`getPedidos` → `getOrders` u `obtenerPedidos`).                                        |
| R-NC-7 | **Idioma consistente**: la UI, los modelos de negocio y los mensajes al usuario van en **español** (`Producto`, `Pedido`); el código técnico y los sufijos de tipo van en **inglés** (`Product`, `product.store.ts`). Se permite el nombre de dominio en inglés si es un término técnico. |
| R-NC-8 | **Commits (Conventional Commits)**: todo mensaje sigue `<tipo>(<ámbito>): <resumen>` en español (ej. `feat(checkout): validar cupón de descuento`); el detalle vive en `R-GC-1` (`../git/02-commits.md`).                                                                                 |

## Tipos y datos

| ID      | Regla                                                                                                                                                                                                                                                                                  |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-NC-9  | **Modelo de dominio vs DTO de backend**: el dominio en `models/*.model.ts` (PascalCase, sin envelope). El shape tolerante del backend en `models/*.dto.ts` con sufijo `Backend...DTO` (`BackendProductDTO`); prohibido usar un DTO como tipo de dominio o exponerlo a los componentes. |
| R-NC-10 | **Sin `any`**: prohibido `any` explícito o implícito en modelos, adapters y servicios. Las entradas no confiables se tipan `unknown` y se estrechan con guards/narrowing. Deuda conocida: adapters con `Record<string, any>` (ver AUDIT).                                              |

## Claves y rutas

| ID      | Regla                                                                                                                                                                                                                                                                                                                                     |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-NC-11 | **Claves de `localStorage` con prefijo `ecom_`** (`ecom_cart_items`, `ecom_auth_data`, `ecom_wishlist`, `ecom_recently_viewed`); prohibido dispersar claves nuevas sin prefijo (deuda: `theme` → ver AUDIT).                                                                                                                              |
| R-NC-12 | **Rutas en `kebab-case`**; el idioma sigue el tipo de término (ADR-17): términos técnicos consolidados en inglés (`/shop`, `/wishlist`, `/checkout`, `/login`) y sustantivos de dominio en español (`/producto/:id`, `/carrito`, `/cuenta`, `/tienda/:storeId`, `/crear-tienda`); la ruta comodín `**` resuelve al `not-found.component`. |

> `R-NC-1..12` sustituyen la numeración anterior (heredada de NestJS). No se
> reutilizan IDs: las reglas sobre controladores, DTOs de entrada/salida y
> sufijos de CQRS del proyecto origen **no existen** en este repo.
>
> **Páginas y capas (ADR-12):** los destinos de ruta viven en
> `features/<feature>/pages/<nombre>/` y conservan el sufijo `.component`
> (`product-list.component.ts`); los presentacionales internos en
> `features/<feature>/components/` y los reutilizables en `shared/ui/`. La
> distinción páginas vs componentes es de rol (`R-AR-1`), no de sufijo.
