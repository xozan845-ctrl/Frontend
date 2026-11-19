# domains/storefront/ — Productos, carrito y wishlist

Dominio compartido del storefront: catálogo público, detalle, carrito híbrido,
favoritos y reseñas. Las experiencias `applications/shop`,
`applications/cart` y `applications/wishlist` consumen su API pública.

- `models/`: producto, tienda, reseña, carrito, DTOs y resultado de persistencia local.
- `adapters/`: normalización de productos, carrito y datos persistidos.
- `repositories/`: puertos `PRODUCT_REPOSITORY`, `CART_REPOSITORY`,
  `LOCAL_STATE` y `STORAGE_ENGINE`.
- `services/`: implementaciones HTTP y de persistencia local (navegador y memoria).
- `state/`: `ProductStore`, `CartStore`, `WishlistStore` y `ReviewsStore`.
- `constants/`: categorías, filtros y contrato de persistencia local.

Este dominio rompe el ciclo histórico entre productos, carrito y wishlist.

## Persistencia local (`LocalStatePort`)

Los stores nunca llaman a `localStorage` ni hacen `JSON.parse`. `LocalStateService`
lee el motor `STORAGE_ENGINE`, valida el JSON con los normalizadores del adaptador
y devuelve `LocalStateResult<T>`:

- `value`: solo datos válidos del dominio.
- `restored`: se recuperó al menos una entrada.
- `recovered`, `discarded`, `reason` y `message`: recuperación explícita y estable,
  independiente del adaptador de almacenamiento.

Las claves siguen el prefijo `ecom_` (`ecom_cart_items`, `ecom_wishlist`,
`ecom_reviews`) y se escriben con un envelope versionado:

```json
{ "version": 1, "context": "storefront", "items": [] }
```

- Se aceptan arreglos planos como formato legado; se migran al envelope al
  persistir de nuevo.
- Se rechazan versiones distintas, envelopes de otro contexto y formas inválidas.
- Cada producto, línea de carrito, cantidad y reseña se valida antes de restaurar;
  las entradas inválidas o duplicadas se descartan sin lanzar excepciones.
- Los límites evitan restaurar colecciones manipuladas: 100 líneas de carrito,
  200 favoritos, 500 reseñas y cantidades enteras entre 1 y 999.
- Si el almacenamiento no está disponible, la lectura devuelve
  `storage-unavailable` y las escrituras/limpiezas son tolerantes al fallo.
