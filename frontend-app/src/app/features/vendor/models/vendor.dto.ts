/**
 * DTOs asumidos del backend del vendedor (Core Engine, `R-C-1`/`R-C-5`): el
 * shape real no existe aún (frontera del backend, ADR-20). Estos tipos documentan
 * lo que los adapters toleran: `snake_case`/`camelCase`, ids numéricos o
 * string, precios como número o string decimal y fechas ISO 8601.
 */

export interface BackendPedidoItemDTO {
  producto_id?: string | number | null;
  productoId?: string | number | null;
  nombre?: string | null;
  sku?: string | null;
  codigo?: string | null;
  precio?: number | string | null;
  precio_unitario?: number | string | null;
  cantidad?: number | string | null;
}

export interface BackendPedidoDTO {
  id?: string | number | null;
  cliente?: BackendClienteDTO | null;
  cliente_id?: string | number | null;
  cliente_nombre?: string | null;
  estado?: string | null;
  creado_en?: string | null;
  fecha?: string | null;
  total?: number | string | null;
  observaciones?: string | null;
  notas?: string | null;
  items?: BackendPedidoItemDTO[] | null;
}

export interface BackendClienteDTO {
  id?: string | number | null;
  codigo?: string | null;
  nombre?: string | null;
  telefono?: string | null;
  email?: string | null;
  correo?: string | null;
}

export interface BackendProductoVendedorDTO {
  id?: string | number | null;
  nombre?: string | null;
  sku?: string | null;
  codigo?: string | null;
  categoria?: string | null;
  precio?: number | string | null;
  disponible?: boolean | null;
  stock?: number | null;
  imagen_url?: string | null;
  imagen?: string | null;
}

/** Oferta del vendedor (`OfertaResponseDto`). */
export interface BackendOfertaVendedorDTO {
  id?: string | number | null;
  tienda_id?: string | number | null;
  tiendaId?: string | number | null;
  producto_id?: string | number | null;
  productoId?: string | number | null;
  sku?: string | null;
  producto_nombre?: string | null;
  productoNombre?: string | null;
  margen?: number | string | null;
  precio_base?: number | string | null;
  precioBase?: number | string | null;
  precio_venta?: number | string | null;
  precioVenta?: number | string | null;
  stock?: number | string | null;
  estado?: string | null;
  creado_en?: string | null;
  creadoEn?: string | null;
}

/** Página de ofertas (`PaginaOfertasResponseDto`). */
export interface BackendPaginaOfertasDTO {
  items?: BackendOfertaVendedorDTO[] | null;
  total?: number | string | null;
  pagina?: number | string | null;
  limite?: number | string | null;
  paginas?: number | string | null;
}
