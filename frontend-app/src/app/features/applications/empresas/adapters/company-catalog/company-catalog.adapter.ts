import type {
  CatalogProduct,
  CreateCatalogProductData,
  UpdateCatalogProductData,
} from '../../../products/public-api';
import { COMPANY_PRODUCT_TEMPLATE_HEADERS } from '../../constants/company-products.constants';
import type {
  CompanyCatalogFilters,
  CompanyCatalogFormValue,
  CompanyCatalogRow,
  CompanyCatalogSort,
  CompanyProductKpis,
} from '../../models/company-catalog.model';
import type {
  CompanyService,
  CreateCompanyServiceData,
  UpdateCompanyServiceData,
} from '../../models/company-service.model';

const MONEY_PATTERN = /^\d+(\.\d{1,2})?$/;

function toInt(value: unknown, fallback = 0): number {
  const n = typeof value === 'string' ? Number(value) : value;
  if (typeof n !== 'number' || !Number.isFinite(n)) return fallback;
  return Math.max(0, Math.trunc(n));
}

function toNullableInt(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'string' ? Number(value) : value;
  if (typeof n !== 'number' || !Number.isFinite(n) || n < 0) return null;
  return Math.trunc(n);
}

function toDateInput(value: string): string {
  return value ? value.slice(0, 10) : '';
}

function normalize(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Convierte el importe del formulario a número; `null` si no es válido. */
export function parseCatalogMoney(value: string): number | null {
  const normalized = value.trim().replace(',', '.');
  if (!MONEY_PATTERN.test(normalized)) return null;
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount < 0) return null;
  return round2(amount);
}

/** Convierte un producto del API en una fila de tabla, sin metadatos locales. */
export function buildProductRow(product: CatalogProduct): CompanyCatalogRow {
  return {
    id: product.id,
    kind: 'producto',
    code: product.sku,
    name: product.name,
    description: product.description,
    category: product.category,
    brand: product.brand,
    barcode: product.barcode,
    price: product.basePrice,
    cost: product.cost,
    margin: computeMargin(product.basePrice, product.cost),
    stock: product.stock,
    minStock: product.minStock,
    maxStock: product.maxStock,
    durationMinutes: null,
    status: product.operationalStatus,
    unit: product.unit,
    allowFractions: product.allowFractions,
    purchaseUnit: product.purchaseUnit,
    contentAmount: product.contentAmount,
    contentUnit: product.contentUnit,
    priceType: product.priceType,
    costType: product.costType,
    warrantyMonths: product.warrantyMonths,
    isRawMaterial: product.isRawMaterial,
    location: product.location,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt || product.createdAt,
  };
}

/** Convierte un servicio de la empresa en una fila de tabla. */
export function buildServiceRow(service: CompanyService): CompanyCatalogRow {
  return {
    id: service.id,
    kind: 'servicio',
    code: service.code,
    name: service.name,
    description: service.description,
    category: service.category,
    brand: service.brand,
    barcode: service.barcode,
    price: service.price,
    cost: service.cost,
    margin: computeMargin(service.price, service.cost),
    stock: null,
    minStock: 0,
    maxStock: null,
    durationMinutes: service.durationMinutes,
    status: service.status,
    unit: service.unit,
    allowFractions: false,
    purchaseUnit: 'Igual que la de venta',
    contentAmount: 0,
    contentUnit: 'Sin contenido',
    priceType: 'fijo',
    costType: 'fijo',
    warrantyMonths: null,
    isRawMaterial: false,
    location: '',
    createdAt: service.createdAt,
    updatedAt: service.updatedAt,
  };
}

/** Convierte una fila en valores para precargar el modal. */
export function rowToFormValue(row: CompanyCatalogRow): CompanyCatalogFormValue {
  return {
    type: row.kind,
    name: row.name,
    description: row.description,
    category: row.category,
    code: row.code,
    brand: row.brand,
    barcode: row.barcode,
    cost: row.cost === null ? '' : row.cost.toFixed(2),
    price: row.price.toFixed(2),
    unit: row.unit,
    allowFractions: row.allowFractions,
    purchaseUnit: row.purchaseUnit,
    contentAmount: row.contentAmount,
    contentUnit: row.contentUnit,
    priceType: row.priceType,
    costType: row.costType,
    stock: row.stock ?? 0,
    minStock: row.minStock,
    maxStock: row.maxStock,
    warrantyMonths: row.warrantyMonths,
    isRawMaterial: row.isRawMaterial,
    location: row.location,
    status: row.status,
    createdAt: toDateInput(row.createdAt),
    durationMinutes: row.durationMinutes ?? 60,
  };
}

/** Datos del API para crear un producto, incluidos sus metadatos (R-PS-01). */
export function formToProductCreate(form: CompanyCatalogFormValue): CreateCatalogProductData {
  return {
    sku: form.code.trim(),
    ...productPayloadFromForm(form),
  };
}

/** Datos del API para editar un producto (el SKU no se modifica). */
export function formToProductUpdate(form: CompanyCatalogFormValue): UpdateCatalogProductData {
  return productPayloadFromForm(form);
}

function productPayloadFromForm(
  form: CompanyCatalogFormValue,
): Omit<CreateCatalogProductData, 'sku'> {
  return {
    name: form.name.trim(),
    description: form.description.trim(),
    category: form.category.trim(),
    basePrice: form.price.trim(),
    stock: form.stock,
    cost: form.cost.trim() || undefined,
    brand: form.brand.trim(),
    barcode: form.barcode.trim(),
    unit: form.unit,
    allowFractions: form.allowFractions,
    purchaseUnit: form.purchaseUnit,
    contentAmount: toInt(form.contentAmount),
    contentUnit: form.contentUnit,
    priceType: form.priceType,
    costType: form.costType,
    minStock: toInt(form.minStock),
    maxStock: toNullableInt(form.maxStock),
    warrantyMonths: toNullableInt(form.warrantyMonths),
    isRawMaterial: form.isRawMaterial,
    location: form.location.trim(),
    operationalStatus: form.status,
  };
}

/** Datos del API para crear un servicio. */
export function formToServiceCreate(form: CompanyCatalogFormValue): CreateCompanyServiceData {
  return {
    code: form.code.trim().toUpperCase(),
    name: form.name.trim(),
    description: form.description.trim(),
    category: form.category.trim(),
    brand: form.brand.trim(),
    barcode: form.barcode.trim(),
    price: form.price.trim(),
    cost: form.cost.trim() || '0.00',
    unit: form.unit,
    durationMinutes: form.durationMinutes,
    status: form.status,
  };
}

/** Datos del API para editar un servicio. */
export function formToServiceUpdate(form: CompanyCatalogFormValue): UpdateCompanyServiceData {
  const data = formToServiceCreate(form);
  return {
    name: data.name,
    description: data.description,
    category: data.category,
    brand: data.brand,
    barcode: data.barcode,
    price: data.price,
    cost: data.cost,
    unit: data.unit,
    durationMinutes: data.durationMinutes,
    status: data.status,
  };
}

/** Filtra las filas por texto, estado, marca y materia prima. */
export function filterCatalogRows(
  rows: readonly CompanyCatalogRow[],
  filters: CompanyCatalogFilters,
): CompanyCatalogRow[] {
  const query = normalize(filters.query);
  const brand = normalize(filters.brand);

  return rows.filter((row) => {
    if (filters.onlyRawMaterial && !row.isRawMaterial) return false;
    if (filters.status === 'activos' && row.status !== 'activo') return false;
    if (filters.status === 'inactivos' && row.status !== 'inactivo') return false;
    if (filters.status === 'stock-bajo' && (row.stock === null || row.stock > row.minStock)) {
      return false;
    }
    if (brand && normalize(row.brand) !== brand) return false;
    if (!query) return true;

    const haystack = normalize(
      `${row.name} ${row.code} ${row.category} ${row.brand} ${row.barcode} ${row.description}`,
    );
    return haystack.includes(query);
  });
}

/** Ordena las filas sin mutar el arreglo original. */
export function sortCatalogRows(
  rows: readonly CompanyCatalogRow[],
  sort: CompanyCatalogSort,
): CompanyCatalogRow[] {
  const sorted = [...rows];
  sorted.sort((a, b) => {
    switch (sort) {
      case 'nombre-az':
        return a.name.localeCompare(b.name, 'es');
      case 'nombre-za':
        return b.name.localeCompare(a.name, 'es');
      case 'precio-asc':
        return a.price - b.price;
      case 'precio-desc':
        return b.price - a.price;
      case 'stock-asc':
        return (a.stock ?? -1) - (b.stock ?? -1);
      case 'stock-desc':
        return (b.stock ?? -1) - (a.stock ?? -1);
      case 'reciente':
        return Date.parse(b.updatedAt || b.createdAt) - Date.parse(a.updatedAt || a.createdAt);
    }
  });
  return sorted;
}

/** Calcula los KPIs de productos (los servicios se calculan en su store). */
export function computeProductKpis(rows: readonly CompanyCatalogRow[]): CompanyProductKpis {
  const products = rows.filter((row) => row.kind === 'producto');
  const withCost = products.filter((row) => row.cost !== null);
  const missingCostCount = products.length - withCost.length;

  return {
    activeProducts: products.filter((row) => row.status === 'activo').length,
    // Un total parcial sería engañoso: si falta algún costo, el KPI queda nulo.
    inventoryValue:
      missingCostCount === 0
        ? round2(withCost.reduce((sum, row) => sum + (row.stock ?? 0) * (row.cost ?? 0), 0))
        : null,
    missingCostCount,
    inventoryOk: products.filter((row) => (row.stock ?? 0) > 0).length,
    rawMaterial: rows.filter((row) => row.isRawMaterial).length,
  };
}

function computeMargin(price: number, cost: number | null): number | null {
  if (cost === null || price <= 0) return null;
  return Math.round(((price - cost) / price) * 1000) / 10;
}

function csvCell(value: string | number): string {
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(headers: readonly string[], rows: readonly (string | number)[][]): string {
  return [headers.map(csvCell).join(','), ...rows.map((row) => row.map(csvCell).join(','))].join(
    '\r\n',
  );
}

/** Plantilla CSV compatible con Excel para importar productos. */
export function buildProductTemplateCsv(): string {
  return toCsv(COMPANY_PRODUCT_TEMPLATE_HEADERS, [
    [
      'Ej. Camisa Polo Talla M',
      'Camisa de algodón',
      'Ropa',
      'CAM-POLO-M-001',
      '250.00',
      '150.00',
      '10',
      '2',
      '7501234567890',
      'Marca Demo',
    ],
  ]);
}

/** Exporta las filas visibles del catálogo a CSV. */
export function buildInventoryCsv(rows: readonly CompanyCatalogRow[]): string {
  return toCsv(
    [
      'nombre',
      'sku',
      'categoria',
      'precio',
      'costo',
      'margen',
      'stock',
      'estado',
      'creado',
      'actualizado',
    ],
    rows.map((row) => [
      row.name,
      row.code,
      row.category,
      row.price.toFixed(2),
      row.cost === null ? '' : row.cost.toFixed(2),
      row.margin === null ? '' : row.margin.toFixed(1),
      row.stock ?? '',
      row.status,
      row.createdAt,
      row.updatedAt,
    ]),
  );
}
