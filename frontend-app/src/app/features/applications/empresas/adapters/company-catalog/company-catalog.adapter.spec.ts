import {
  buildInventoryCsv,
  buildProductRow,
  buildProductTemplateCsv,
  buildServiceRow,
  computeProductKpis,
  filterCatalogRows,
  formToProductCreate,
  formToProductUpdate,
  formToServiceCreate,
  formToServiceUpdate,
  parseCatalogMoney,
  rowToFormValue,
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
  operationalStatus: 'activo',
  cost: 40,
  brand: 'Marca',
  barcode: '750123',
  unit: 'Unidad (u)',
  allowFractions: false,
  purchaseUnit: 'Igual que la de venta',
  contentAmount: 0,
  contentUnit: 'Sin contenido',
  priceType: 'fijo',
  costType: 'fijo',
  minStock: 2,
  maxStock: 20,
  warrantyMonths: null,
  isRawMaterial: false,
  location: 'Estante 1',
  createdAt: '2026-10-27T00:00:00.000Z',
  updatedAt: '2026-10-27T00:00:00.000Z',
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
  it('valida importes con punto o coma', () => {
    expect(parseCatalogMoney('1,50')).toBe(1.5);
    expect(parseCatalogMoney('150.00')).toBe(150);
    expect(parseCatalogMoney('abc')).toBeNull();
    expect(parseCatalogMoney('-1')).toBeNull();
  });

  it('construye una fila con los campos server-side del producto', () => {
    expect(buildProductRow(product)).toMatchObject({
      id: 'p-1',
      kind: 'producto',
      name: 'Teclado',
      cost: 40,
      margin: 60,
      stock: 10,
      status: 'activo',
      brand: 'Marca',
      minStock: 2,
      isRawMaterial: false,
    });
  });

  it('no sustituye un costo ausente por 0', () => {
    const row = buildProductRow({ ...product, cost: null });

    expect(row.cost).toBeNull();
    expect(row.margin).toBeNull();
    expect(buildInventoryCsv([row])).toContain('Teclado,SKU-1,Periféricos,100.00,,,10');
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

  it('convierte una fila al formulario y respeta el costo desconocido', () => {
    expect(rowToFormValue(buildServiceRow(service))).toMatchObject({
      type: 'servicio',
      code: 'SRV-1',
      cost: '80.00',
      price: '200.00',
      durationMinutes: 60,
      createdAt: '2026-10-27',
    });
    expect(rowToFormValue(buildProductRow({ ...product, cost: null })).cost).toBe('');
  });

  it('mapea el formulario a los payloads de producto y servicio', () => {
    expect(formToProductCreate(makeForm())).toMatchObject({
      sku: 'CAM-1',
      name: 'Camisa',
      basePrice: '250.00',
      stock: 5,
      cost: '150.00',
      brand: 'Marca Demo',
      barcode: '750123',
      unit: 'Unidad (u)',
      minStock: 2,
      maxStock: 20,
      warrantyMonths: 12,
      operationalStatus: 'activo',
    });
    expect(formToProductUpdate(makeForm())).not.toHaveProperty('sku');
    expect(formToProductCreate(makeForm({ cost: '' }))).toMatchObject({ cost: undefined });
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
    expect(formToServiceUpdate(makeForm({ type: 'servicio' }))).not.toHaveProperty('code');
  });

  it('filtra por texto, estado, marca y materia prima', () => {
    const rows: CompanyCatalogRow[] = [
      buildProductRow(product),
      buildProductRow({ ...product, id: 'p-2', name: 'Mouse', operationalStatus: 'inactivo' }),
      buildProductRow({ ...product, id: 'p-3', name: 'Harina', isRawMaterial: true }),
      buildServiceRow(service),
    ];
    const base = {
      query: '',
      status: 'todos' as const,
      brand: '',
      sort: 'nombre-az' as const,
      onlyRawMaterial: false,
    };

    expect(filterCatalogRows(rows, { ...base, query: 'mouse' })).toHaveLength(1);
    expect(filterCatalogRows(rows, { ...base, status: 'inactivos' })).toHaveLength(1);
    expect(filterCatalogRows(rows, { ...base, brand: 'marca' })).toHaveLength(3);
    expect(filterCatalogRows(rows, { ...base, onlyRawMaterial: true })).toHaveLength(1);
    expect(filterCatalogRows(rows, { ...base, query: 'no existe' })).toHaveLength(0);
  });

  it('ordena por nombre, precio, stock y fecha', () => {
    const rows = [
      buildProductRow(product),
      buildProductRow({
        ...product,
        id: 'p-2',
        name: 'Mouse',
        basePrice: 50,
        stock: 2,
        updatedAt: '2026-10-28T00:00:00.000Z',
      }),
    ];

    expect(sortCatalogRows(rows, 'nombre-az').map((row) => row.name)).toEqual(['Mouse', 'Teclado']);
    expect(sortCatalogRows(rows, 'nombre-za').map((row) => row.name)).toEqual(['Teclado', 'Mouse']);
    expect(sortCatalogRows(rows, 'precio-asc').map((row) => row.name)).toEqual([
      'Mouse',
      'Teclado',
    ]);
    expect(sortCatalogRows(rows, 'precio-desc').map((row) => row.name)).toEqual([
      'Teclado',
      'Mouse',
    ]);
    expect(sortCatalogRows(rows, 'stock-asc').map((row) => row.name)).toEqual(['Mouse', 'Teclado']);
    expect(sortCatalogRows(rows, 'stock-desc').map((row) => row.name)).toEqual([
      'Teclado',
      'Mouse',
    ]);
    expect(sortCatalogRows(rows, 'reciente')[0].name).toBe('Mouse');
  });

  it('calcula KPIs y bloquea el valor si falta algún costo', () => {
    const rows = [
      buildProductRow(product),
      buildProductRow({
        ...product,
        id: 'p-2',
        stock: 0,
        status: 'agotado',
        cost: 10,
        isRawMaterial: true,
      }),
      buildServiceRow(service),
    ];

    expect(computeProductKpis(rows)).toEqual({
      activeProducts: 2,
      inventoryValue: 400,
      missingCostCount: 0,
      inventoryOk: 1,
      rawMaterial: 1,
    });

    const withMissing = [...rows, buildProductRow({ ...product, id: 'p-3', cost: null })];
    expect(computeProductKpis(withMissing)).toMatchObject({
      inventoryValue: null,
      missingCostCount: 1,
    });
  });

  it('calcula KPIs con filas vacías o solo servicios', () => {
    expect(computeProductKpis([])).toEqual({
      activeProducts: 0,
      inventoryValue: 0,
      missingCostCount: 0,
      inventoryOk: 0,
      rawMaterial: 0,
    });
    expect(computeProductKpis([buildServiceRow(service)])).toMatchObject({
      activeProducts: 0,
      inventoryValue: 0,
      missingCostCount: 0,
    });
  });

  it('genera la plantilla y el CSV de inventario escapando comas y comillas', () => {
    const template = buildProductTemplateCsv();
    expect(template).toContain('nombre,descripcion,categoria,sku');
    expect(template).toContain('CAM-POLO-M-001');

    const csv = buildInventoryCsv([buildProductRow({ ...product, name: 'Teclado, "Pro"' })]);
    expect(csv).toContain('nombre,sku,categoria,precio,costo,margen,stock');
    expect(csv).toContain('"Teclado, ""Pro"""');
  });

  it('usa margen nulo cuando el precio no permite calcularlo', () => {
    expect(buildProductRow({ ...product, basePrice: 0 }).margin).toBeNull();
    expect(buildProductRow({ ...product, operationalStatus: 'inactivo' }).status).toBe('inactivo');
  });
});
