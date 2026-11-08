import { normalizeClientSearch } from './client.adapter';
import type { CsvHeaderIndex } from '../../models/client.types';
import type { ClientCsvParseResult, ClientImportRow } from '../../models/client.model';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const NAME_HEADERS = [
  'nombre',
  'nombre_cliente',
  'nombre_completo',
  'cliente',
  'name',
  'full_name',
];
const PHONE_HEADERS = ['telefono', 'celular', 'movil', 'whatsapp', 'phone', 'mobile'];
const EMAIL_HEADERS = ['email', 'correo', 'correo_electronico', 'e_mail', 'mail'];
const COMPANY_HEADERS = ['empresa', 'negocio', 'organizacion', 'company', 'organization'];
const BUYER_ID_HEADERS = [
  'comprador_id',
  'buyer_id',
  'buyerid',
  'id_comprador',
  'cliente_id',
  'customer_id',
];

function normalizeHeader(value: string): string {
  return normalizeClientSearch(value)
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function findHeaderIndex(headers: readonly string[], aliases: readonly string[]): number {
  return headers.findIndex((header) => aliases.includes(header));
}

function cellAt(cells: readonly string[], index: number): string {
  return index >= 0 ? (cells[index] ?? '') : '';
}

/** Detecta `;`, `,` o tabulador contando el encabezado fuera de comillas. */
function detectDelimiter(text: string): string {
  const counts = new Map<string, number>([
    [';', 0],
    [',', 0],
    ['\t', 0],
  ]);
  let inQuotes = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"') {
      if (inQuotes && text[index + 1] === '"') {
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (!inQuotes && (char === '\n' || char === '\r')) break;
    if (!inQuotes && counts.has(char)) {
      counts.set(char, (counts.get(char) ?? 0) + 1);
    }
  }

  let delimiter = ',';
  let max = 0;
  for (const [candidate, count] of counts) {
    if (count > max) {
      max = count;
      delimiter = candidate;
    }
  }
  return delimiter;
}

/** Parser CSV mínimo con soporte de comillas, comillas escapadas y saltos. */
function parseDelimitedRows(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if (inQuotes) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      row.push(field);
      field = '';
    } else if (char === '\r' || char === '\n') {
      if (char === '\r' && text[index + 1] === '\n') index += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/**
 * Lee un CSV exportado desde Excel (o compatible). Acepta `;`, `,` y tabulador,
 * encabezados en español/inglés y devuelve filas válidas + errores por fila.
 */
export function parseClientsCsv(text: string): ClientCsvParseResult {
  const clean = text.replace(/^\uFEFF/, '');
  if (!clean.trim()) return { rows: [], errors: ['El archivo está vacío.'] };

  const table = parseDelimitedRows(clean, detectDelimiter(clean));
  if (table.length === 0) return { rows: [], errors: ['No se encontraron filas en el archivo.'] };

  const headers = (table[0] ?? []).map(normalizeHeader);
  const index: CsvHeaderIndex = {
    name: findHeaderIndex(headers, NAME_HEADERS),
    phone: findHeaderIndex(headers, PHONE_HEADERS),
    email: findHeaderIndex(headers, EMAIL_HEADERS),
    company: findHeaderIndex(headers, COMPANY_HEADERS),
    buyerId: findHeaderIndex(headers, BUYER_ID_HEADERS),
  };

  if (index.name < 0 && index.phone < 0 && index.email < 0) {
    return {
      rows: [],
      errors: ['El archivo no tiene una columna de nombre, teléfono o correo.'],
    };
  }

  const rows: ClientImportRow[] = [];
  const errors: string[] = [];

  for (let rowIndex = 1; rowIndex < table.length; rowIndex += 1) {
    const cells = table[rowIndex] ?? [];
    if (cells.every((cell) => !cell.trim())) continue;

    const rowNumber = rowIndex + 1;
    const rawName = cellAt(cells, index.name).trim();
    const phone = cellAt(cells, index.phone).trim().replace(/^'/, '');
    const email = cellAt(cells, index.email).trim();
    const company = cellAt(cells, index.company).trim();
    const buyerId = cellAt(cells, index.buyerId).trim();
    const name = rawName || (index.name < 0 ? (email ? email.split('@')[0] : phone) : '');

    if (!name) {
      errors.push(`Fila ${rowNumber}: falta el nombre.`);
      continue;
    }
    if (email && !EMAIL_PATTERN.test(email)) {
      errors.push(`Fila ${rowNumber}: correo inválido (${email}).`);
      continue;
    }
    if (email.length > 120) {
      errors.push(`Fila ${rowNumber}: el correo supera 120 caracteres.`);
      continue;
    }

    rows.push({
      name: name.slice(0, 80),
      phone: phone.slice(0, 30),
      email: email.toLowerCase(),
      company: company.slice(0, 100),
      ...(buyerId ? { buyerId: buyerId.slice(0, 120) } : {}),
    });
  }

  if (rows.length === 0 && errors.length === 0) {
    errors.push('No se encontraron filas con datos.');
  }
  return { rows, errors };
}
