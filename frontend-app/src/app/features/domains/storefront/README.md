# domains/storefront/ — Productos, carrito y wishlist

Dominio compartido del storefront: catálogo público, detalle, carrito híbrido,
favoritos y reseñas. Las experiencias `applications/shop`,
`applications/cart` y `applications/wishlist` consumen su API pública.

- `models/`: producto, tienda, reseña, carrito y DTOs. `CartSnapshot.total`
  distingue `0` (total autoritativo válido) de `null` (ausente o inválido); el
  respaldo derivado se aplica solo en el segundo caso.
- `adapters/`: normalización de productos y carrito.
- `repositories/`: puertos `PRODUCT_REPOSITORY` y `CART_REPOSITORY`.
- `services/`: implementaciones HTTP.
- `state/`: `ProductStore`, `CartStore`, `WishlistStore` y `ReviewsStore`.
- `constants/`: categorías y filtros.

Este dominio rompe el ciclo histórico entre productos, carrito y wishlist.
