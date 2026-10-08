/**
 * Tienda (tenant) de Core Engine. El backend es **multi-tienda**: cada vendedor
 * tiene una tienda y publica sus propias ofertas. El storefront resuelve la
 * tienda desde la URL (`/tienda/:storeId`), nunca desde configuración estática.
 */
export interface Store {
  id: string;
  vendorId: string;
  name: string;
  description: string;
}
