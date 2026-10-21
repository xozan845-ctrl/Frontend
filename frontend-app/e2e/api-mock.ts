import { type Page } from '@playwright/test';

/**
 * Fixtures del backend Core Engine para la suite E2E (`R-E-12`, suite
 * hermética): `page.route` intercepta `/api/v1/**` y responde con datos
 * controlados. En el entorno `e2e` la app corre con `apiUrl: '/api/v1'`
 * (mismo origen), así que ningún test toca un backend real.
 */

/** IVA del POS del vendedor (espeja `VENDOR_TAX_RATE`). */
const IVA = 0.15;

const redondear2 = (value: number): number => Math.round(value * 100) / 100;

interface ProductoFixture {
  id: string;
  sku: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  precio: number;
  stock: number;
}

/** Ofertas del storefront: 3 `Electronics`, 1 `Accessories` y 2 `Fitness` (R-E-1). */
const PRODUCTOS: readonly ProductoFixture[] = [
  {
    id: 'p-1',
    sku: 'SKU-AUD-01',
    nombre: 'Ultra-Comfort Wireless Headphones',
    descripcion: 'Audífonos con cancelación activa de ruido y 40 horas de batería.',
    categoria: 'Electronics',
    precio: 199.99,
    stock: 15,
  },
  {
    id: 'p-2',
    sku: 'SKU-ACC-02',
    nombre: 'Minimalist Leather Chronograph',
    descripcion: 'Reloj de cuero italiano con cristal de zafiro.',
    categoria: 'Accessories',
    precio: 149.5,
    stock: 8,
  },
  {
    id: 'p-3',
    sku: 'SKU-TEC-03',
    nombre: 'Ergonomic Mechanical Keyboard',
    descripcion: 'Teclado mecánico hot-swappable con retroiluminación RGB por tecla.',
    categoria: 'Electronics',
    precio: 129.99,
    stock: 20,
  },
  {
    id: 'p-4',
    sku: 'SKU-YOG-04',
    nombre: 'Eco-Friendly Premium Yoga Mat',
    descripcion: 'Tapete biodegradable con agarre antideslizante.',
    categoria: 'Fitness',
    precio: 79,
    stock: 25,
  },
  {
    id: 'p-5',
    sku: 'SKU-BOT-05',
    nombre: 'Stainless Steel Insulated Bottle',
    descripcion: 'Botella térmica de acero inoxidable de doble pared.',
    categoria: 'Fitness',
    precio: 34.99,
    stock: 50,
  },
  {
    id: 'p-6',
    sku: 'SKU-HUB-06',
    nombre: 'Smart Home Hub & Speaker',
    descripcion: 'Central domótica con altavoz de alta fidelidad.',
    categoria: 'Electronics',
    precio: 89.99,
    stock: 12,
  },
];

interface ProductoVendedorFixture {
  id: string;
  nombre: string;
  sku: string;
  categoria: string;
  precio: number;
  disponible: boolean;
}

/** Catálogo del POS; el sexto producto está agotado (botón deshabilitado, R-E-18). */
const PRODUCTOS_VENDEDOR: readonly ProductoVendedorFixture[] = [
  {
    id: 'vp-1',
    nombre: 'KPBM Shampoo Keratina',
    sku: 'KPBM-001',
    categoria: 'Cuidado capilar',
    precio: 180,
    disponible: true,
  },
  {
    id: 'vp-2',
    nombre: 'Salon Plus Mascarilla',
    sku: 'SP-002',
    categoria: 'Cuidado capilar',
    precio: 220,
    disponible: true,
  },
  {
    id: 'vp-3',
    nombre: 'Camelia Oil Tratamiento',
    sku: 'CAM-003',
    categoria: 'Tratamientos',
    precio: 195,
    disponible: true,
  },
  {
    id: 'vp-4',
    nombre: 'Kolescrem Crema Profesional',
    sku: 'KOL-004',
    categoria: 'Cremas',
    precio: 150,
    disponible: true,
  },
  {
    id: 'vp-5',
    nombre: 'Tinte Profesional 6.1',
    sku: 'TIN-005',
    categoria: 'Tintes',
    precio: 120,
    disponible: true,
  },
  {
    id: 'vp-6',
    nombre: 'KPBM Acondicionador',
    sku: 'KPBM-006',
    categoria: 'Cuidado capilar',
    precio: 180,
    disponible: false,
  },
];

interface OfertaVendedorFixture {
  id: string;
  tienda_id: string;
  producto_id: string;
  sku: string;
  producto_nombre: string;
  margen: number;
  precio_base: number;
  precio_venta: number;
  stock: number;
  estado: string;
  creado_en: string;
}

/** Ofertas del panel de productos (R-E-23): una activa y una agotada. */
const OFERTAS_VENDEDOR: readonly OfertaVendedorFixture[] = [
  {
    id: 'of-1',
    tienda_id: 'tienda-demo',
    producto_id: 'vp-1',
    sku: 'KPBM-001',
    producto_nombre: 'KPBM Shampoo Keratina',
    margen: 15,
    precio_base: 180,
    precio_venta: 207,
    stock: 12,
    estado: 'activa',
    creado_en: '2026-10-21T10:00:00.000Z',
  },
  {
    id: 'of-2',
    tienda_id: 'tienda-demo',
    producto_id: 'vp-2',
    sku: 'SP-002',
    producto_nombre: 'Salon Plus Mascarilla',
    margen: 20,
    precio_base: 220,
    precio_venta: 264,
    stock: 0,
    estado: 'agotada',
    creado_en: '2026-10-20T10:00:00.000Z',
  },
];

interface ClienteFixture {
  id: string;
  codigo: string;
  nombre: string;
  telefono: string;
  email: string;
}

const CLIENTES: readonly ClienteFixture[] = [
  {
    id: 'vc-1',
    codigo: 'CL-00125',
    nombre: 'Carla López',
    telefono: '+505 8765 4321',
    email: 'carla.lopez@correo.com',
  },
  {
    id: 'vc-2',
    codigo: 'CL-00124',
    nombre: 'Distribuidora Kemuel',
    telefono: '+505 2222 3333',
    email: 'ventas@kemuel.com',
  },
  {
    id: 'vc-3',
    codigo: 'CL-00123',
    nombre: 'Estética Bella',
    telefono: '+505 8888 1212',
    email: 'hola@esteticabella.com',
  },
];

interface ItemFixture {
  producto_id: string;
  nombre: string;
  sku: string;
  precio: number;
  cantidad: number;
}

interface PedidoFixture {
  id: string;
  cliente: { id: string; nombre: string } | null;
  cliente_nombre: string;
  fecha: string;
  estado: 'pendiente' | 'en_proceso' | 'completado' | 'cancelado';
  total: number;
  items: ItemFixture[];
  observaciones: string;
}

/** Fecha ISO 8601 UTC de `daysAgo` a la hora local indicada. */
function fecha(now: Date, daysAgo: number, hours: number, minutes: number): string {
  const date = new Date(now);
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
}

function productoVendedor(productoId: string): ProductoVendedorFixture {
  const producto = PRODUCTOS_VENDEDOR.find((candidate) => candidate.id === productoId);
  if (!producto) throw new Error(`Producto sin fixture E2E: ${productoId}`);
  return producto;
}

function item(productoId: string, cantidad: number): ItemFixture {
  const producto = productoVendedor(productoId);
  return {
    producto_id: producto.id,
    nombre: producto.nombre,
    sku: producto.sku,
    precio: producto.precio,
    cantidad,
  };
}

/**
 * Pedidos demo con fechas relativas a hoy para que "recientes" tenga datos en
 * cualquier fecha de ejecución. Los cuatro estados del dominio representados.
 */
function pedidosIniciales(now: Date): PedidoFixture[] {
  return [
    {
      id: 'PED-000125',
      cliente: { id: 'vc-1', nombre: 'Carla López' },
      cliente_nombre: 'Carla López',
      fecha: fecha(now, 0, 10, 32),
      estado: 'en_proceso',
      total: 1339.75,
      items: [item('vp-1', 2), item('vp-2', 1), item('vp-3', 3)],
      observaciones: '',
    },
    {
      id: 'PED-000124',
      cliente: { id: 'vc-2', nombre: 'Distribuidora Kemuel' },
      cliente_nombre: 'Distribuidora Kemuel',
      fecha: fecha(now, 1, 16, 5),
      estado: 'completado',
      total: 2415,
      items: [item('vp-5', 10), item('vp-4', 6)],
      observaciones: 'Facturar a 30 días.',
    },
    {
      id: 'PED-000123',
      cliente: { id: 'vc-3', nombre: 'Estética Bella' },
      cliente_nombre: 'Estética Bella',
      fecha: fecha(now, 2, 9, 45),
      estado: 'pendiente',
      total: 920,
      items: [item('vp-2', 2), item('vp-5', 3)],
      observaciones: '',
    },
    {
      id: 'PED-000122',
      cliente: null,
      cliente_nombre: 'Cliente ocasional',
      fecha: fecha(now, 3, 12, 15),
      estado: 'cancelado',
      total: 690,
      items: [item('vp-4', 4)],
      observaciones: 'El cliente no confirmó.',
    },
  ];
}

/** Cuerpo del `POST /vendedores/pedidos` (tolera campos ausentes). */
interface PedidoCreadoPayload {
  cliente_id?: string | null;
  descuento?: number;
  observaciones?: string;
  items?: { producto_id?: string; cantidad?: number }[];
}

/** Pedido nuevo coherente con la cartera y el catálogo de fixtures (R-E-18). */
function crearPedido(payload: PedidoCreadoPayload | null, pedidos: PedidoFixture[]): PedidoFixture {
  const cliente = CLIENTES.find((candidate) => candidate.id === payload?.cliente_id) ?? null;
  const items = (payload?.items ?? []).map((linea) => {
    const producto = PRODUCTOS_VENDEDOR.find(
      (candidate) => candidate.id === String(linea.producto_id ?? ''),
    );
    return {
      producto_id: String(linea.producto_id ?? ''),
      nombre: producto?.nombre ?? 'Producto',
      sku: producto?.sku ?? '',
      precio: producto?.precio ?? 0,
      cantidad: Math.max(1, Math.round(Number(linea.cantidad) || 1)),
    };
  });

  const subtotal = items.reduce((sum, linea) => sum + linea.precio * linea.cantidad, 0);
  const descuento = Math.min(100, Math.max(0, Number(payload?.descuento) || 0));
  const total = redondear2(subtotal * (1 - descuento / 100) * (1 + IVA));

  const maximo = pedidos.reduce((acc, pedido) => {
    const numero = Number(pedido.id.replace(/\D/g, ''));
    return Number.isFinite(numero) ? Math.max(acc, numero) : acc;
  }, 0);

  return {
    id: `PED-${String(maximo + 1).padStart(6, '0')}`,
    cliente: cliente ? { id: cliente.id, nombre: cliente.nombre } : null,
    cliente_nombre: cliente?.nombre ?? 'Cliente ocasional',
    fecha: new Date().toISOString(),
    estado: 'pendiente',
    total,
    items,
    observaciones: typeof payload?.observaciones === 'string' ? payload.observaciones : '',
  };
}

function storefrontDe(storeId: string): unknown {
  return {
    tienda: {
      id: storeId,
      vendedor_id: 'vendedor-demo',
      nombre: 'Tienda Demo',
      descripcion: 'Storefront de demostración para pruebas E2E.',
    },
    ofertas: PRODUCTOS.map((producto) => ({
      id: `of-${producto.id.replace('p-', '')}`,
      producto_id: producto.id,
      producto_nombre: producto.nombre,
      precio_venta: producto.precio.toFixed(2),
      stock: producto.stock,
      sku: producto.sku,
    })),
  };
}

const CATALOGO = {
  items: PRODUCTOS.map((producto) => ({
    id: producto.id,
    sku: producto.sku,
    nombre: producto.nombre,
    descripcion: producto.descripcion,
    categoria: producto.categoria,
  })),
};

/** Minúsculas sin acentos para que la búsqueda de cartera sea tolerante. */
function sinAcentos(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

function filtrarClientes(query: string): ClienteFixture[] {
  const needle = sinAcentos(query);
  return CLIENTES.filter(
    (cliente) =>
      !needle ||
      [cliente.nombre, cliente.codigo, cliente.telefono, cliente.email].some((field) =>
        sinAcentos(field).includes(needle),
      ),
  );
}

/**
 * Instala la intercepción del API en la página: se registra antes de navegar
 * (fixture `auto` de cada suite) y responde todo `/api/v1/**` con los datos
 * controlados de este módulo.
 */
export async function mockApi(page: Page): Promise<void> {
  const pedidos = pedidosIniciales(new Date());
  const ofertas = OFERTAS_VENDEDOR.map((oferta) => ({ ...oferta }));

  await page.route(
    (url) => url.pathname.startsWith('/api/v1/'),
    async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      const path = url.pathname.replace('/api/v1', '');
      const method = request.method();

      if (method === 'GET' && /^\/tiendas\/[^/]+$/.test(path)) {
        await route.fulfill({ json: storefrontDe(path.split('/')[2]) });
        return;
      }

      if (method === 'GET' && path === '/catalog/productos') {
        await route.fulfill({ json: CATALOGO });
        return;
      }

      if (method === 'GET' && path === '/vendedores/me/tienda') {
        await route.fulfill({
          json: {
            id: 'tienda-demo',
            empresa_id: 'empresa-demo',
            propietario_usuario_id: 'vendedor-demo',
            participacion_porcentaje: 100,
            vendedor_id: 'vendedor-demo',
            nombre: 'Tienda Demo',
            descripcion: 'Storefront de demostración para pruebas E2E.',
            creado_en: '2026-10-21T20:57:47.870Z',
          },
        });
        return;
      }

      if (method === 'GET' && path === '/vendedores/me/productos') {
        await route.fulfill({ json: { data: PRODUCTOS_VENDEDOR } });
        return;
      }

      if (method === 'GET' && path === '/vendedores/me/ofertas') {
        const pagina = Number(url.searchParams.get('pagina') ?? 1) || 1;
        const limite = Number(url.searchParams.get('limite') ?? 20) || 20;
        const inicio = (pagina - 1) * limite;
        await route.fulfill({
          json: {
            items: ofertas.slice(inicio, inicio + limite),
            total: ofertas.length,
            pagina,
            limite,
            paginas: Math.max(1, Math.ceil(ofertas.length / limite)),
          },
        });
        return;
      }

      if (method === 'PATCH' && /^\/vendedores\/productos\/[^/]+$/.test(path)) {
        const id = decodeURIComponent(path.split('/')[3]);
        const payload = request.postDataJSON() as { margen?: number } | null;
        const oferta = ofertas.find((candidate) => candidate.id === id);
        if (!oferta || typeof payload?.margen !== 'number') {
          await route.fulfill({ status: 404, json: { mensaje: 'Oferta no encontrada.' } });
          return;
        }
        oferta.margen = payload.margen;
        oferta.precio_venta = redondear2(oferta.precio_base * (1 + payload.margen / 100));
        await route.fulfill({ json: oferta });
        return;
      }

      if (method === 'GET' && path === '/vendedores/clientes') {
        await route.fulfill({ json: { items: filtrarClientes(url.searchParams.get('q') ?? '') } });
        return;
      }

      if (method === 'GET' && path === '/vendedores/pedidos') {
        await route.fulfill({ json: { data: pedidos } });
        return;
      }

      if (method === 'POST' && path === '/vendedores/pedidos') {
        const payload = request.postDataJSON() as PedidoCreadoPayload | null;
        const creado = crearPedido(payload, pedidos);
        pedidos.unshift(creado);
        await route.fulfill({ json: { data: creado } });
        return;
      }

      if (method === 'GET' && /^\/vendedores\/pedidos\/[^/]+$/.test(path)) {
        const id = decodeURIComponent(path.split('/')[3]);
        const pedido = pedidos.find((candidate) => candidate.id === id);
        if (pedido) {
          await route.fulfill({ json: { data: pedido } });
          return;
        }
        await route.fulfill({ status: 404, json: { mensaje: 'No se encontró el pedido.' } });
        return;
      }

      await route.fulfill({
        status: 404,
        json: { mensaje: `Ruta sin fixture E2E: ${method} ${path}` },
      });
    },
  );
}
