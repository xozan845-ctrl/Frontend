/** Extras opcionales de una ficha de producto para el SEO (`R-UX-6`). */
export interface ProductSeoExtras {
  /** Imagen que se publica en `og:image`/`twitter:image` (absoluta o relativa). */
  imageUrl?: string;
  /** Define `schema.org/InStock` o `schema.org/OutOfStock` (por defecto, disponible). */
  inStock?: boolean;
}
