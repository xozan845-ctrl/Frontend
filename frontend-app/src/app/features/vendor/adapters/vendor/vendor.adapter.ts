import {
  unwrapApiListResponse,
  unwrapApiSingleResponse,
} from '../../../../core/models/api-response.dto';
import {
  BackendClienteDTO,
  BackendOfertaVendedorDTO,
  BackendPaginaOfertasDTO,
  BackendPedidoDTO,
  BackendPedidoItemDTO,
  BackendProductoVendedorDTO,
} from '../../models/vendor.dto';
import {
  Client,
  OrderLine,
  OrderStatus,
  VendorOrder,
  VendorProduct,
} from '../../models/vendor-order.model';
import { VendorOffer, VendorOfferPage } from '../../models/vendor-offer.model';

/** Alias tolerados del `estado` del backend hacia los estados del dominio. */
const STATUS_BY_ALIAS: Readonly<Record<string, OrderStatus>> = {
  pendiente: 'pendiente',
  en_proceso: 'en_proceso',
  completado: 'completado',
  completada: 'completado',
  cancelado: 'cancelado',
  cancelada: 'cancelado',
};

/**
 * Normaliza `estado` del backend (mayúsculas, espacios, alias) a los estados
 * del dominio; un valor desconocido cae a `pendiente` para no romper la UI.
 */
export function normalizeOrderStatus(value: unknown): OrderStatus {
  if (typeof value !== 'string') return 'pendiente';
  const key = value.trim().toLowerCase().replace(/\s+/g, '_');
  return STATUS_BY_ALIAS[key] ?? 'pendiente';
}

/** Objeto plano o `null` (descarta arrays, `null` y primitivos). */
function toObject<T>(raw: unknown): T | null {
  return raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as T) : null;
}

/** Id válido (descarta `null`, `undefined` y cadena vacía). */
function hasId(value: unknown): boolean {
  return value !== null && value !== undefined && value !== '';
}

/** Monto (número o string decimal) con 2 decimales; inválido o negativo → 0. */
function toAmount(value: unknown): number {
  const n = typeof value === 'string' ? Number(value.replace(',', '.')) : value;
  if (typeof n !== 'number' || !Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100) / 100;
}

/** Cantidad entera ≥ 1; inválida o menor que 1 → 1 (la línea existe, luego hay pieza). */
function toQuantity(value: unknown): number {
  const n = typeof value === 'string' ? Number(value) : value;
  if (typeof n !== 'number' || !Number.isFinite(n)) return 1;
  return Math.max(1, Math.round(n));
}

/** Texto no vacío o el fallback dado. */
function toText(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

/** Línea del pedido o `null` si no tiene forma de producto (se descarta). */
function adaptOrderLine(raw: unknown): OrderLine | null {
  const item = toObject<BackendPedidoItemDTO>(raw);
  if (!item) return null;
  const productId = item.producto_id ?? item.productoId ?? item.sku ?? item.codigo;
  if (!hasId(productId)) return null;

  return {
    productId: String(productId),
    name: toText(item.nombre, 'Producto'),
    sku: toText(item.sku ?? item.codigo, ''),
    unitPrice: toAmount(item.precio ?? item.precio_unitario),
    quantity: toQuantity(item.cantidad),
  };
}

/**
 * Pedido del vendedor (`GET /vendedores/pedidos`, `POST /vendedores/pedidos`).
 * Tolerante a `snake_case`/`camelCase`, al envelope `{ data }` y a ids
 * numéricos; `null` si no hay id (no es un pedido interpretable).
 */
export function adaptOrderFromBackend(raw: unknown): VendorOrder | null {
  const pedido = unwrapApiSingleResponse<BackendPedidoDTO>(raw);
  if (!pedido || typeof pedido !== 'object') return null;
  if (!hasId(pedido.id)) return null;

  const clienteDto = toObject<BackendClienteDTO>(pedido.cliente);
  const client = adaptClientFromBackend(clienteDto);

  return {
    id: String(pedido.id),
    clientId: client?.id ?? (hasId(pedido.cliente_id) ? String(pedido.cliente_id) : null),
    clientName:
      client?.name ??
      toText(clienteDto?.nombre, toText(pedido.cliente_nombre, 'Cliente ocasional')),
    createdAt: toText(pedido.creado_en ?? pedido.fecha, ''),
    status: normalizeOrderStatus(pedido.estado),
    total: toAmount(pedido.total),
    lines: Array.isArray(pedido.items)
      ? pedido.items
          .map((item) => adaptOrderLine(item))
          .filter((line): line is OrderLine => line !== null)
      : [],
    notes: toText(pedido.observaciones ?? pedido.notas, ''),
  };
}

/** Lista de pedidos tolerante a array directo o envelopes `{ data }`/`{ items }`. */
export function adaptOrdersFromBackend(response: unknown): VendorOrder[] {
  return unwrapApiListResponse<unknown>(response)
    .map((raw) => adaptOrderFromBackend(raw))
    .filter((order): order is VendorOrder => order !== null);
}

/**
 * Cliente de la cartera (`GET /vendedores/clientes`, `POST /vendedores/clientes`).
 * `null` si no hay id; código, teléfono y correo caen a cadena vacía.
 */
export function adaptClientFromBackend(raw: unknown): Client | null {
  const cliente = unwrapApiSingleResponse<BackendClienteDTO>(raw);
  if (!cliente || typeof cliente !== 'object') return null;
  if (!hasId(cliente.id)) return null;

  return {
    id: String(cliente.id),
    code: toText(cliente.codigo, ''),
    name: toText(cliente.nombre, 'Cliente'),
    phone: toText(cliente.telefono, ''),
    email: toText(cliente.email ?? cliente.correo, ''),
  };
}

/** Lista de clientes tolerante a array directo o envelopes. */
export function adaptClientsFromBackend(response: unknown): Client[] {
  return unwrapApiListResponse<unknown>(response)
    .map((raw) => adaptClientFromBackend(raw))
    .filter((client): client is Client => client !== null);
}

/**
 * Producto del catálogo del vendedor (`GET /vendedores/me/productos`).
 * `inStock` sale de `disponible`, si no de `stock > 0` y, sin datos, se asume
 * disponible para no bloquear la venta desde el POS.
 */
export function adaptVendorProductFromBackend(raw: unknown): VendorProduct | null {
  const producto = unwrapApiSingleResponse<BackendProductoVendedorDTO>(raw);
  if (!producto || typeof producto !== 'object') return null;
  if (!hasId(producto.id)) return null;

  return {
    id: String(producto.id),
    name: toText(producto.nombre, 'Producto'),
    sku: toText(producto.sku ?? producto.codigo, ''),
    category: toText(producto.categoria, 'General'),
    price: toAmount(producto.precio),
    imageUrl: toText(producto.imagen_url ?? producto.imagen, ''),
    inStock:
      typeof producto.disponible === 'boolean'
        ? producto.disponible
        : typeof producto.stock === 'number'
          ? producto.stock > 0
          : true,
  };
}

/** Catálogo del vendedor tolerante a array directo o envelopes. */
export function adaptVendorProductsFromBackend(response: unknown): VendorProduct[] {
  return unwrapApiListResponse<unknown>(response)
    .map((raw) => adaptVendorProductFromBackend(raw))
    .filter((product): product is VendorProduct => product !== null);
}

/** Entero no negativo; inválido → `fallback`. */
function toCount(value: unknown, fallback = 0): number {
  const n = typeof value === 'string' ? Number(value) : value;
  return typeof n === 'number' && Number.isFinite(n) ? Math.max(0, Math.round(n)) : fallback;
}

/**
 * Oferta del vendedor (`GET /vendedores/me/ofertas`,
 * `PATCH /vendedores/productos/:id`). `null` si no hay id.
 */
export function adaptVendorOfferFromBackend(raw: unknown): VendorOffer | null {
  const oferta = unwrapApiSingleResponse<BackendOfertaVendedorDTO>(raw);
  if (!oferta || typeof oferta !== 'object') return null;
  if (!hasId(oferta.id)) return null;

  return {
    id: String(oferta.id),
    storeId: hasId(oferta.tienda_id ?? oferta.tiendaId)
      ? String(oferta.tienda_id ?? oferta.tiendaId)
      : '',
    productId: hasId(oferta.producto_id ?? oferta.productoId)
      ? String(oferta.producto_id ?? oferta.productoId)
      : '',
    sku: toText(oferta.sku, ''),
    productName: toText(oferta.producto_nombre ?? oferta.productoNombre, 'Producto'),
    margin: Math.min(90, toCount(oferta.margen)),
    basePrice: toAmount(oferta.precio_base ?? oferta.precioBase),
    salePrice: toAmount(oferta.precio_venta ?? oferta.precioVenta),
    stock: toCount(oferta.stock),
    status: toText(oferta.estado, 'activa'),
    createdAt: toText(oferta.creado_en ?? oferta.creadoEn, ''),
  };
}

/**
 * Página de ofertas (`PaginaOfertasResponseDto`): tolera `{ items, total,
 * pagina, limite, paginas }`, array directo y envelopes `{ data }`.
 */
export function adaptVendorOfferPageFromBackend(response: unknown): VendorOfferPage {
  const page =
    toObject<BackendPaginaOfertasDTO>(unwrapApiSingleResponse<BackendPaginaOfertasDTO>(response)) ??
    {};
  const rawItems = Array.isArray(page.items)
    ? page.items
    : unwrapApiListResponse<unknown>(response);
  const items = rawItems
    .map((raw) => adaptVendorOfferFromBackend(raw))
    .filter((offer): offer is VendorOffer => offer !== null);

  return {
    items,
    total: toCount(page.total ?? items.length),
    page: Math.max(1, toCount(page.pagina, 1)),
    limit: Math.max(1, toCount(page.limite, 20)),
    pages: Math.max(1, toCount(page.paginas, 1)),
  };
}
