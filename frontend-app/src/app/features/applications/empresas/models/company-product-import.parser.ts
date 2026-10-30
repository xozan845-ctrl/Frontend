import type { CompanyProductImportRow } from './company-catalog-operations.model';

const MAX_IMPORT_ROWS = 200;
const MONEY_PATTERN = /^\d+(\.\d{1,2})?$/;

function toInt(value: unknown): number {
  const n = typeof value === 'string' ? Number(value) : value;
  return typeof n === 'number' && Number.isFinite(n) ? Math.max(0, Math.trunc(n)) : 0;
}

function toNullableInt(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'string' ? Number(value) : value;
  if (typeof n !== 'number' || !Number.isFinite(n) || n < 0) return null;
  return Math.trunc(n);
}

/** Divide una línea CSV respetando comillas dobles. */
function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (quoted && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === ',' && !quoted) {
      cells.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  return cells;
}

/** Mapea encabezados del CSV/plantilla a las claves internas. */
const CSV_ALIASES: Readonly<Record<string, keyof CompanyProductImportRow>> = {
  nombre: 'name',
  name: 'name',
  descripcion: 'description',
  description: 'description',
  categoria: 'category',
  category: 'category',
  sku: 'sku',
  precio_venta: 'basePrice',
  precio_base: 'basePrice',
  baseprice: 'basePrice',
  costo: 'cost',
  cost: 'cost',
  stock_inicial: 'stock',
  stock: 'stock',
  stock_minimo: 'minStock',
  min_stock: 'minStock',
  stock_maximo: 'maxStock',
  max_stock: 'maxStock',
  codigo_barras: 'barcode',
  barcode: 'barcode',
  marca: 'brand',
  brand: 'brand',
  unidad: 'unit',
  unit: 'unit',
  es_materia_prima: 'isRawMaterial',
  materia_prima: 'isRawMaterial',
  ubicacion: 'location',
  location: 'location',
};

function parseBoolean(value: string): boolean {
  return ['1', 'true', 'si', 'sí', 'yes', 'x'].includes(value.trim().toLowerCase());
}

/**
 * Parser CSV puro para la importación masiva. Devuelve filas válidas y errores
 * por número de fila; el backend valida de nuevo al persistir (R-PS-04).
 */
export function parseProductsCsv(text: string): {
  rows: CompanyProductImportRow[];
  errors: string[];
} {
  const lines = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);
  if (lines.length < 2) return { rows: [], errors: ['El archivo no contiene filas de datos.'] };

  const headers = splitCsvLine(lines[0]).map((header) => CSV_ALIASES[header.toLowerCase()]);
  if (!headers.includes('sku') || !headers.includes('name')) {
    return { rows: [], errors: ['La plantilla debe incluir las columnas nombre y sku.'] };
  }

  const rows: CompanyProductImportRow[] = [];
  const errors: string[] = [];
  for (let index = 1; index < lines.length; index += 1) {
    if (rows.length >= MAX_IMPORT_ROWS) {
      errors.push(`Solo se permiten ${MAX_IMPORT_ROWS} filas por importación.`);
      break;
    }

    const cells = splitCsvLine(lines[index]);
    const record: Partial<Record<keyof CompanyProductImportRow, string>> = {};
    headers.forEach((key, column) => {
      if (key) record[key] = cells[column] ?? '';
    });

    const rowNumber = index + 1;
    const sku = (record.sku ?? '').trim();
    const name = (record.name ?? '').trim();
    const basePrice = (record.basePrice ?? '').trim().replace(',', '.');
    const stock = Number((record.stock ?? '0').trim() || '0');
    if (!sku || !/^[A-Za-z0-9-]{2,32}$/.test(sku)) {
      errors.push(`Fila ${rowNumber}: SKU inválido.`);
      continue;
    }
    if (name.length < 2) {
      errors.push(`Fila ${rowNumber}: nombre inválido.`);
      continue;
    }
    if (!MONEY_PATTERN.test(basePrice)) {
      errors.push(`Fila ${rowNumber}: precio inválido.`);
      continue;
    }
    if (!Number.isFinite(stock) || stock < 0) {
      errors.push(`Fila ${rowNumber}: stock inválido.`);
      continue;
    }

    rows.push({
      sku,
      name,
      description: record.description ?? '',
      category: record.category ?? '',
      basePrice,
      stock: Math.trunc(stock),
      cost: (record.cost ?? '').trim(),
      brand: record.brand ?? '',
      barcode: record.barcode ?? '',
      unit: record.unit?.trim() || 'Unidad (u)',
      minStock: toInt(record.minStock),
      maxStock: toNullableInt(record.maxStock),
      isRawMaterial: parseBoolean(record.isRawMaterial ?? ''),
      location: record.location ?? '',
    });
  }

  return { rows, errors };
}
