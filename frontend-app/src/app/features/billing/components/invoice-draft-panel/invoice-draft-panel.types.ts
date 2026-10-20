/** Cantidad nueva de una línea (el panel deja el producto en la línea). */
export interface InvoiceLineQuantityChange {
  productId: string;
  quantity: number;
}
