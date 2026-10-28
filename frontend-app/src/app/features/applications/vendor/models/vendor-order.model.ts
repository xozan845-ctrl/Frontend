/** Estados del pedido del vendedor; viajan al backend en `estado`. */
export type OrderStatus = 'pendiente' | 'en_proceso' | 'completado' | 'cancelado';

/** Método de entrega elegido al registrar el pedido (panel "Información del pedido"). */
export type DeliveryMethod = 'retiro_tienda' | 'envio_domicilio';

/** Cliente de la cartera del vendedor. */
export interface Client {
  id: string;
  /** Código visible en el POS (`CL-00125`); vacío si el backend no lo trae. */
  code: string;
  name: string;
  phone: string;
  email: string;
}

/** Producto del catálogo propio del vendedor (POS). */
export interface VendorProduct {
  id: string;
  name: string;
  sku: string;
  category: string;
  /** Precio unitario en moneda local; nunca negativo. */
  price: number;
  /** URL de imagen; vacía cuando el backend no la trae (se pinta un placeholder). */
  imageUrl: string;
  inStock: boolean;
}

/** Línea de un pedido ya registrado (precio congelado al momento de la venta). */
export interface OrderLine {
  productId: string;
  name: string;
  sku: string;
  unitPrice: number;
  quantity: number;
}

/** Pedido registrado por el vendedor. */
export interface VendorOrder {
  id: string;
  clientId: string | null;
  clientName: string;
  /** ISO 8601 UTC; cadena vacía si el backend no la envía. */
  createdAt: string;
  status: OrderStatus;
  /** Total facturado con descuento e IVA aplicados. */
  total: number;
  lines: OrderLine[];
  notes: string;
}

/** Línea del borrador: el producto completo más la cantidad elegida. */
export interface OrderDraftLine {
  product: VendorProduct;
  quantity: number;
}

/** Información general del pedido en el borrador. */
export interface OrderDraftInfo {
  storeId: string;
  /** Nombre de la tienda para el panel "Información del pedido" (solo display). */
  storeName: string;
  /** Fecha del pedido en formato `yyyy-mm-dd` (input date). */
  date: string;
  deliveryMethod: DeliveryMethod;
}

/** Borrador del pedido en curso (POS). */
export interface OrderDraft {
  client: Client | null;
  info: OrderDraftInfo;
  lines: OrderDraftLine[];
  /** Descuento porcentual 0–100 aplicado al subtotal. */
  discountPercent: number;
  observations: string;
}

/** Payload de registro del pedido (`POST /vendedores/pedidos`). */
export interface CreateOrderPayload {
  clientId: string | null;
  storeId: string;
  date: string;
  deliveryMethod: DeliveryMethod;
  discountPercent: number;
  observations: string;
  items: { productId: string; quantity: number }[];
}

/** Payload de alta de cliente (`POST /vendedores/clientes`). */
export interface CreateClientPayload {
  name: string;
  phone: string;
  email: string;
}
