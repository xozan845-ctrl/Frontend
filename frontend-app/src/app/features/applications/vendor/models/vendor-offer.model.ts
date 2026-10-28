/** Oferta del vendedor (`GET /vendedores/me/ofertas`, `PATCH /vendedores/productos/:id`). */
export interface VendorOffer {
  id: string;
  storeId: string;
  productId: string;
  sku: string;
  productName: string;
  /** Margen en enteros 0–90 (RN-01). */
  margin: number;
  /** Precio base en córdobas. */
  basePrice: number;
  /** Precio de venta final en córdobas (`base × (1 + margen/100)`). */
  salePrice: number;
  stock: number;
  status: string;
  /** ISO 8601 UTC; cadena vacía si el backend no la envía. */
  createdAt: string;
}

/** Página de ofertas del vendedor (`PaginaOfertasResponseDto`). */
export interface VendorOfferPage {
  items: VendorOffer[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

/** Cambio de margen (`PATCH /vendedores/productos/:id`). */
export interface UpdateOfferMarginData {
  offerId: string;
  margin: number;
}
