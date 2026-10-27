import {
  buildInventoryCsv,
  buildProductRow,
  buildProductTemplateCsv,
  buildServiceRow,
  computeProductKpis,
  defaultProductMetadata,
  filterCatalogRows,
  formToProductCreate,
  formToProductUpdate,
  formToServiceCreate,
  formToServiceUpdate,
  metadataFromForm,
  parseCatalogMoney,
  rowToFormValue,
  sanitizeProductMetadataMap,
  sortCatalogRows,
} from './company-catalog.adapter';
import type {
  CompanyCatalogFormValue,
  CompanyCatalogRow,
} from '../../models/company-catalog.model';
import type { CompanyService } from '../../models/company-service.model';
import type { CatalogProduct } from '../../../products/models/catalog-product.model';

const product: CatalogProduct = {
  id: 'p-1',
  companyId: 'e-1',
  sku: 'SKU-1',
  name: 'Teclado',
  description: 'Demo',
  category: 'Periféricos',
  basePrice: 100,
  stock: 10,
  status: 'disponible',
  createdAt: '2026-10-27T00:00:00.000Z',
};

const service: CompanyService = {
  id: 's-1',
  companyId: 'e-1',
  code: 'SRV-1',
  name: 'Soporte',
  description: 'Demo',
  category: 'Servicios',
  brand: 'Marca Demo',
  barcode: '',
  price: 200,
  cost: 80,
  unit: 'Hora (h)',
  durationMinutes: 60,
  status: 'activo',
  createdAt: '2026-10-27T00:00:00.000Z',
  updatedAt: '2026-10-27T00:00:00.000Z',
};

function makeForm(overrides: Partial<CompanyCatalogFormValue> = {}): CompanyCatalogFormValue {
  return {
    type: 'producto',
    name: 'Camisa',
    description: 'Demo',
    category: 'Ropa',
    code: 'CAM-1',
    brand: 'Marca Demo',
    barcode: '750123',
    cost: '150.00',
    price: '250.00',
    unit: 'Unidad (u)',
    allowFractions: false,
    purchaseUnit: 'Igual que la de venta',
    contentAmount: 0,
    contentUnit: 'Sin contenido',
    priceType: 'fijo',
    costType: 'fijo',
    stock: 5,
    minStock: 2,
    maxStock: 20,
    warrantyMonths: 12,
    isRawMaterial: false,
    location: 'Estante 1',
    status: 'activo',
    createdAt: '2026-10-27',
    durationMinutes: 60,
    ...overrides,
  };
}

describe('company-catalog adapter', () => {
  it('valida importes y construye metadatos por defecto', () => {
    expect(parseCatalogMoney('1,50')).toBe(1.5);
    expect(parseCatalogMoney('abc')).toBeNull();
    expect(defaultProductMetadata(product)).toMatchObject({
      cost: 0,
      unit: 'Unidad (u)',
      minStock: 0,
      isRawMaterial: false,
      createdAt: product.createdAt,
    });
  });

  it('sanea metadatos y descarta valores inválidos', () => {
    const map = sanitizeProductMetadataMap({
      'p-1': {
        cost: '50.5',
        brand: 'Marca',
        minStock: '2',
        maxStock: '',
        warrantyMonths: '12',
        isRawMaterial: true,
        priceType: 'escala',
        statusOverride: 'inactivo',
      },
      'p-2': null,
    });

    expect(map['p-1']).toMatchObject({
      cost: 50.5,
      brand: 'Marca',
      minStock: 2,
      maxStock: null,
      warrantyMonths: 12,
      isRawMaterial: true,
      priceType: 'escala',
      statusOverride: 'inactivo',
    });
    expect(map['p-2']).toBeUndefined();
  });

  it('construye metadatos desde el formulario', () => {
    const metadata = metadataFromForm(makeForm());

    expect(metadata).toMatchObject({
      cost: 150,
      brand: 'Marca Demo',
      barcode: '750123',
      minStock: 2,
      maxStock: 20,
      warrantyMonths: 12,
      statusOverride: 'activo',
    });
  });

  it('combina producto y metadatos en una fila', () => {
    const metadata = { ...defaultProductMetadata(product), cost: 40, brand: 'Marca' };
    const row = buildProductRow(product, metadata);

    expect(row).toMatchObject({
      id: 'p-1',
      kind: 'producto',
      name: 'Teclado',
      cost: 40,
      margin: 60,
      stock: 10,
      status: 'activo',
    });
  });

  it('normaliza servicios a filas de catálogo', () => {
    const row = buildServiceRow(service);

    expect(row).toMatchObject({
      kind: 'servicio',
      stock: null,
      durationMinutes: 60,
      margin: 60,
      unit: 'Hora (h)',
      isRawMaterial: false,
    });
  });

  it('convierte una fila al formulario', () => {
    const form = rowToFormValue(buildServiceRow(service));

    expect(form).toMatchObject({
      type: 'servicio',
      code: 'SRV-1',
      cost: '80.00',
      price: '200.00',
      durationMinutes: 60,
      createdAt: '2026-10-27',
    });
  });

  it('mapea el formulario a los payloads de producto y servicio', () => {
    expect(formToProductCreate(makeForm())).toEqual({
      sku: 'CAM-1',
      name: 'Camisa',
      description: 'Demo',
      category: 'Ropa',
      basePrice: '250.00',
      stock: 5,
    });
    expect(formToProductUpdate(makeForm())).not.toHaveProperty('sku');
    expect(formToServiceCreate(makeForm({ type: 'servicio', durationMinutes: 90 }))).toMatchObject({
      code: 'CAM-1',
      name: 'Camisa',
      brand: 'Marca Demo',
      barcode: '750123',
      price: '250.00',
      cost: '150.00',
      unit: 'Unidad (u)',
      durationMinutes: 90,
      status: 'activo',
    });
  });

  it('filtra por texto, estado, marca y materia prima', () => {
    const rows: CompanyCatalogRow[] = [
      buildProductRow(product, {
        ...defaultProductMetadata(product),
        brand: 'Marca',
        minStock: 20,
      }),
      buildProductRow(
        { ...product, id: 'p-2', name: 'Mouse', status: 'agotado' },
        {
          ...defaultProductMetadata(product),
          brand: 'Otra',
          isRawMaterial: true,
        },
      ),
      buildServiceRow(service),
    ];

    expect(
      filterCatalogRows(rows, {
        query: 'mouse',
        status: 'todos',
        brand: '',
        sort: 'nombre-az',
        onlyRawMaterial: false,
      }),
    ).toHaveLength(1);
    expect(
      filterCatalogRows(rows, {
        query: '',
        status: 'inactivos',
        brand: '',
        sort: 'nombre-az',
        onlyRawMaterial: false,
      }),
    ).toHaveLength(1);
    expect(
      filterCatalogRows(rows, {
        query: '',
        status: 'todos',
        brand: 'marca',
        sort: 'nombre-az',
        onlyRawMaterial: false,
      }),
    ).toHaveLength(1);
    expect(
      filterCatalogRows(rows, {
        query: '',
        status: 'todos',
        brand: '',
        sort: 'nombre-az',
        onlyRawMaterial: true,
      }),
    ).toHaveLength(1);
    expect(
      filterCatalogRows(rows, {
        query: '',
        status: 'stock-bajo',
        brand: '',
        sort: 'nombre-az',
        onlyRawMaterial: false,
      }),
    ).toHaveLength(1);
  });

  it('ordena por nombre, precio, stock y reciente', () => {
    const rows = [
      buildProductRow(product, defaultProductMetadata(product)),
      buildProductRow(
        { ...product, id: 'p-2', name: 'Mouse', basePrice: 50, stock: 2 },
        {
          ...defaultProductMetadata(product),
          updatedAt: '2026-10-28T00:00:00.000Z',
        },
      ),
    ];

    expect(sortCatalogRows(rows, 'nombre-az').map((row) => row.name)).toEqual(['Mouse', 'Teclado']);
    expect(sortCatalogRows(rows, 'precio-desc').map((row) => row.name)).toEqual([
      'Teclado',
      'Mouse',
    ]);
    expect(sortCatalogRows(rows, 'stock-asc').map((row) => row.name)).toEqual(['Mouse', 'Teclado']);
    expect(sortCatalogRows(rows, 'reciente').map((row) => row.name)).toEqual(['Mouse', 'Teclado']);
  });

  it('calcula KPIs de productos', () => {
    const rows = [
      buildProductRow(product, { ...defaultProductMetadata(product), cost: 40 }),
      buildProductRow(
        { ...product, id: 'p-2', stock: 0, status: 'agotado' },
        {
          ...defaultProductMetadata(product),
          cost: 10,
          isRawMaterial: true,
        },
      ),
      buildServiceRow(service),
    ];

    expect(computeProductKpis(rows)).toEqual({
      activeProducts: 1,
      inventoryValue: 400,
      inventoryOk: 1,
      rawMaterial: 1,
    });
  });

  it('genera la plantilla y el CSV de inventario', () => {
    const template = buildProductTemplateCsv();
    expect(template).toContain('nombre,descripcion,categoria,sku');
    expect(template).toContain('CAM-POLO-M-001');

    const csv = buildInventoryCsv([buildProductRow(product, defaultProductMetadata(product))]);
    expect(csv).toContain('nombre,sku,categoria,precio,costo,margen,stock');
    expect(csv).toContain('Teclado,SKU-1,Periféricos,100.00,0.00,100.0,10');
  });

  it('sanea metadatos vacíos y valores límite', () => {
    expect(sanitizeProductMetadataMap(null)).toEqual({});
    const map = sanitizeProductMetadataMap({
      'p-1': {
        cost: -1,
        unit: '',
        purchaseUnit: '',
        contentUnit: '',
        priceType: 'otro',
        costType: 'otro',
        maxStock: 'abc',
        warrantyMonths: -1,
        statusOverride: 'otro',
      },
    });

    expect(map['p-1']).toMatchObject({
      cost: 0,
      unit: 'Unidad (u)',
      purchaseUnit: 'Igual que la de venta',
      contentUnit: 'Sin contenido',
      priceType: 'fijo',
      costType: 'fijo',
      maxStock: null,
      warrantyMonths: null,
      statusOverride: null,
    });
  });

  it('cubre estados alternos de producto y servicio', () => {
    const inactive = buildProductRow(
      { ...product, status: 'agotado' },
      { ...defaultProductMetadata(product), statusOverride: 'inactivo', cost: 150, maxStock: 5 },
    );
    expect(inactive.status).toBe('inactivo');
    expect(inactive.margin).toBeLessThan(0);

    const serviceRow = buildServiceRow({ ...service, status: 'inactivo' });
    expect(serviceRow.status).toBe('inactivo');

    const free = buildProductRow({ ...product, basePrice: 0 }, defaultProductMetadata(product));
    expect(free.margin).toBe(0);
  });

  it('filtra por estado y marca sin coincidencias', () => {
    const rows = [buildProductRow(product, defaultProductMetadata(product))];
    const base = {
      query: '',
      status: 'todos' as const,
      brand: '',
      sort: 'nombre-az' as const,
      onlyRawMaterial: false,
    };

    expect(filterCatalogRows(rows, { ...base, status: 'activos' })).toHaveLength(1);
    expect(filterCatalogRows(rows, { ...base, status: 'inactivos' })).toHaveLength(0);
    expect(filterCatalogRows(rows, { ...base, brand: 'otra' })).toHaveLength(0);
    expect(filterCatalogRows(rows, { ...base, query: 'no existe' })).toHaveLength(0);
  });

  it('ordena en todas las direcciones', () => {
    const rows = [
      buildProductRow(product, defaultProductMetadata(product)),
      buildProductRow(
        { ...product, id: 'p-2', name: 'Mouse', basePrice: 50, stock: 2 },
        {
          ...defaultProductMetadata(product),
          updatedAt: '2026-10-28T00:00:00.000Z',
        },
      ),
    ];

    expect(sortCatalogRows(rows, 'nombre-za').map((row) => row.name)).toEqual(['Teclado', 'Mouse']);
    expect(sortCatalogRows(rows, 'precio-asc').map((row) => row.name)).toEqual([
      'Mouse',
      'Teclado',
    ]);
    expect(sortCatalogRows(rows, 'stock-desc').map((row) => row.name)).toEqual([
      'Teclado',
      'Mouse',
    ]);
  });

  it('usa el fallback de fecha y ordena servicios con stock nulo', () => {
    const row = buildProductRow(product, { ...defaultProductMetadata(product), updatedAt: '' });
    expect(row.updatedAt).toBe(product.createdAt);

    const serviceRows = [
      buildServiceRow(service),
      buildServiceRow({ ...service, id: 's-2', name: 'Otro servicio' }),
    ];
    expect(sortCatalogRows(serviceRows, 'stock-asc').map((item) => item.id)).toEqual([
      's-1',
      's-2',
    ]);
    expect(sortCatalogRows(serviceRows, 'stock-desc').map((item) => item.id)).toEqual([
      's-1',
      's-2',
    ]);
  });

  it('calcula KPIs con filas vacías o solo servicios', () => {
    expect(computeProductKpis([])).toEqual({
      activeProducts: 0,
      inventoryValue: 0,
      inventoryOk: 0,
      rawMaterial: 0,
    });
    expect(computeProductKpis([buildServiceRow(service)])).toEqual({
      activeProducts: 0,
      inventoryValue: 0,
      inventoryOk: 0,
      rawMaterial: 0,
    });
    expect(
      computeProductKpis([
        { ...buildProductRow(product, defaultProductMetadata(product)), stock: null, cost: 10 },
      ]),
    ).toMatchObject({ inventoryValue: 0, inventoryOk: 0 });
  });

  it('escapa comas y comillas en el CSV', () => {
    const csv = buildInventoryCsv([
      buildProductRow({ ...product, name: 'Teclado, "Pro"' }, defaultProductMetadata(product)),
    ]);

    expect(csv).toContain('"Teclado, ""Pro"""');
  });

  it('mapea la actualización de servicio y filas de producto al formulario', () => {
    const form = rowToFormValue(buildProductRow(product, defaultProductMetadata(product)));
    expect(form.type).toBe('producto');
    expect(form.createdAt).toBe('2026-10-27');

    expect(formToServiceUpdate(makeForm({ type: 'servicio' }))).toMatchObject({
      name: 'Camisa',
      price: '250.00',
      durationMinutes: 60,
    });
  });
});
