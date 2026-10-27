import type { OrderResponse } from '../../../cart/public-api';
import {
  COMPANY_CLIENT_ACTIVE_DAYS,
  COMPANY_CLIENT_FREQUENT_ORDERS,
} from '../../constants/company-clients.constants';
import type {
  CompanyClient,
  CompanyClientChip,
  CompanyClientCsvParseResult,
  CompanyClientImportRow,
  CompanyClientKpis,
  CompanyClientRecord,
  CompanyClientSource,
  CompanyClientsTab,
  CompanyClientStatus,
  CreateCompanyClientPayload,
} from '../../models/company-client.model';
import type { CsvHeaderIndex, OrderAggregate } from '../../models/company-client.types';

const DAY_MS = 86_400_000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_STORED_CLIENTS = 2_000;
const EXCLUDED_ORDER_STATUSES = new Set(['cancelada', 'cancelled', 'devuelta', 'returned']);

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function toText(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function parseTimestamp(value: string | null | undefined): number | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function startOfMonth(now: Date): number {
  return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
}

/** Normaliza texto para búsquedas sin distinguir mayúsculas ni acentos. */
export function normalizeCompanyClientSearch(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function normalizePhone(value: string): string {
  return value.replace(/\D/g, '');
}

/** Nombre visible cuando Core Engine solo expone el id del comprador. */
export function companyClientFallbackName(buyerId: string): string {
  const visibleId = buyerId.length > 8 ? buyerId.slice(-8) : buyerId;
  return `Cliente ${visibleId.toUpperCase()}`;
}

function statusFor(
  ordersCount: number,
  isActive: boolean,
  isNew: boolean,
  isFrequent: boolean,
): CompanyClientStatus {
  if (ordersCount === 0) return 'sin_compras';
  if (!isActive) return 'inactivo';
  if (isNew) return 'nuevo';
  if (isFrequent) return 'frecuente';
  return 'activo';
}

function toCompanyClient(
  base: CompanyClientRecord,
  aggregate: OrderAggregate | null,
  now: Date,
): CompanyClient {
  const ordersCount = aggregate?.ordersCount ?? 0;
  const totalSpent = aggregate ? roundMoney(aggregate.totalSpent) : 0;
  const firstPurchaseAt = aggregate?.firstPurchaseAt ?? null;
  const lastPurchaseAt = aggregate?.lastPurchaseAt ?? null;
  const createdAt = aggregate?.firstPurchaseAt ?? base.createdAt;
  const createdMs = parseTimestamp(createdAt);
  const lastPurchaseMs = parseTimestamp(lastPurchaseAt);
  const isActive =
    lastPurchaseMs !== null &&
    now.getTime() - lastPurchaseMs <= COMPANY_CLIENT_ACTIVE_DAYS * DAY_MS;
  const isNew = createdMs !== null && createdMs >= startOfMonth(now);
  const isFrequent = ordersCount >= COMPANY_CLIENT_FREQUENT_ORDERS;
  const isInactive = ordersCount > 0 && !isActive;

  return {
    ...base,
    createdAt,
    ordersCount,
    totalSpent,
    averageTicket: ordersCount > 0 ? roundMoney(totalSpent / ordersCount) : 0,
    firstPurchaseAt,
    lastPurchaseAt,
    isActive,
    isNew,
    isFrequent,
    isInactive,
    status: statusFor(ordersCount, isActive, isNew, isFrequent),
  };
}

/**
 * Cruza las órdenes de la empresa con la cartera local. Las órdenes se agrupan
 * por `buyerId`; los datos de contacto locales (o los que exponga el backend)
 * enriquecen el cliente derivado. Los clientes locales sin compras también se
 * incluyen para que aparezcan como "Sin compras".
 */
export function buildCompanyClients(
  orders: readonly OrderResponse[],
  localClients: readonly CompanyClientRecord[],
  now: Date = new Date(),
): CompanyClient[] {
  const aggregates = new Map<string, OrderAggregate>();
  const sortedOrders = [...orders].sort(
    (a, b) => (parseTimestamp(a.createdAt) ?? 0) - (parseTimestamp(b.createdAt) ?? 0),
  );

  for (const order of sortedOrders) {
    const buyerId = order.buyerId?.trim();
    if (!buyerId) continue;

    const status = (order.status ?? '').toLowerCase();
    if (EXCLUDED_ORDER_STATUSES.has(status)) continue;

    const current = aggregates.get(buyerId) ?? {
      buyerId,
      ordersCount: 0,
      totalSpent: 0,
      firstPurchaseAt: null,
      firstPurchaseMs: null,
      lastPurchaseAt: null,
      lastPurchaseMs: null,
    };

    const total = Number.isFinite(order.total) ? order.total : 0;
    const createdAt = order.createdAt;
    const createdMs = parseTimestamp(createdAt);

    current.ordersCount += 1;
    current.totalSpent = roundMoney(current.totalSpent + total);
    if (createdMs !== null) {
      if (current.firstPurchaseMs === null || createdMs < current.firstPurchaseMs) {
        current.firstPurchaseMs = createdMs;
        current.firstPurchaseAt = createdAt;
      }
      if (current.lastPurchaseMs === null || createdMs >= current.lastPurchaseMs) {
        current.lastPurchaseMs = createdMs;
        current.lastPurchaseAt = createdAt;
      }
    }
    aggregates.set(buyerId, current);
  }

  const localByBuyer = new Map<string, CompanyClientRecord>();
  const standaloneLocal: CompanyClientRecord[] = [];
  for (const record of localClients) {
    const buyerId = record.buyerId?.trim();
    if (buyerId) {
      if (!localByBuyer.has(buyerId)) localByBuyer.set(buyerId, record);
    } else {
      standaloneLocal.push(record);
    }
  }

  const clients: CompanyClient[] = [];
  for (const aggregate of aggregates.values()) {
    const local = localByBuyer.get(aggregate.buyerId);
    localByBuyer.delete(aggregate.buyerId);

    clients.push(
      toCompanyClient(
        {
          id: local?.id ?? `buyer-${aggregate.buyerId}`,
          buyerId: aggregate.buyerId,
          name: local?.name || companyClientFallbackName(aggregate.buyerId),
          phone: local?.phone ?? '',
          email: local?.email ?? '',
          company: local?.company ?? '',
          source: local?.source ?? 'order',
          createdAt: local?.createdAt ?? aggregate.firstPurchaseAt ?? now.toISOString(),
        },
        aggregate,
        now,
      ),
    );
  }

  for (const record of [...localByBuyer.values(), ...standaloneLocal]) {
    clients.push(toCompanyClient(record, null, now));
  }

  return clients.sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
}

/** Indicadores de la cartera completa (no dependen de filtros ni paginación). */
export function computeCompanyClientKpis(clients: readonly CompanyClient[]): CompanyClientKpis {
  const totalClients = clients.length;
  const activeClients = clients.filter((client) => client.isActive).length;
  const newThisMonth = clients.filter((client) => client.isNew).length;
  const totalGenerated = roundMoney(clients.reduce((sum, client) => sum + client.totalSpent, 0));
  const totalOrders = clients.reduce((sum, client) => sum + client.ordersCount, 0);
  const topClient =
    [...clients]
      .filter((client) => client.ordersCount > 0 && client.totalSpent > 0)
      .sort(
        (a, b) =>
          b.totalSpent - a.totalSpent ||
          b.ordersCount - a.ordersCount ||
          a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }),
      )[0] ?? null;

  return {
    totalClients,
    activeClients,
    newThisMonth,
    topClient,
    totalGenerated,
    averageTicket: totalOrders > 0 ? roundMoney(totalGenerated / totalOrders) : 0,
    totalOrders,
  };
}

/** Aplica la vista principal (lista, top, frecuentes o inactivos). */
export function filterCompanyClientsByTab(
  clients: readonly CompanyClient[],
  tab: CompanyClientsTab,
): CompanyClient[] {
  if (tab === 'top') {
    return [...clients]
      .filter((client) => client.ordersCount > 0)
      .sort(
        (a, b) =>
          b.totalSpent - a.totalSpent ||
          b.ordersCount - a.ordersCount ||
          a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }),
      );
  }

  if (tab === 'frequent') {
    return [...clients]
      .filter((client) => client.isFrequent)
      .sort(
        (a, b) =>
          b.ordersCount - a.ordersCount ||
          b.totalSpent - a.totalSpent ||
          a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }),
      );
  }

  if (tab === 'inactive') {
    return [...clients]
      .filter((client) => client.isInactive)
      .sort(
        (a, b) =>
          (parseTimestamp(a.lastPurchaseAt) ?? 0) - (parseTimestamp(b.lastPurchaseAt) ?? 0) ||
          a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }),
      );
  }

  return [...clients].sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
}

/** Aplica los filtros rápidos de la tabla. */
export function filterCompanyClientsByChip(
  clients: readonly CompanyClient[],
  chip: CompanyClientChip,
): CompanyClient[] {
  switch (chip) {
    case 'active':
      return clients.filter((client) => client.isActive);
    case 'inactive':
      return clients.filter((client) => client.isInactive);
    case 'frequent':
      return clients.filter((client) => client.isFrequent);
    case 'new':
      return clients.filter((client) => client.isNew);
    case 'with-orders':
      return clients.filter((client) => client.ordersCount > 0);
    case 'without-orders':
      return clients.filter((client) => client.ordersCount === 0);
    default:
      return [...clients];
  }
}

/** Busca por nombre, teléfono, correo, empresa o id de comprador. */
export function searchCompanyClients(
  clients: readonly CompanyClient[],
  query: string,
): CompanyClient[] {
  const normalizedQuery = normalizeCompanyClientSearch(query);
  if (!normalizedQuery) return [...clients];

  const digits = normalizePhone(query);
  return clients.filter((client) => {
    const haystack = normalizeCompanyClientSearch(
      [client.name, client.phone, client.email, client.company, client.buyerId ?? ''].join(' '),
    );
    if (haystack.includes(normalizedQuery)) return true;
    if (digits.length >= 3) {
      return (
        normalizePhone(client.phone).includes(digits) ||
        normalizePhone(client.buyerId ?? '').includes(digits)
      );
    }
    return false;
  });
}

/** Valida y sanea la cartera leída de `localStorage`. */
export function sanitizeCompanyClientRecords(value: unknown): CompanyClientRecord[] {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  const records: CompanyClientRecord[] = [];
  for (const raw of value) {
    if (!isRecord(raw)) continue;
    const id = toText(raw['id']);
    if (!id || seen.has(id)) continue;

    const source = raw['source'];
    const record: CompanyClientRecord = {
      id,
      name: toText(raw['name'], 'Cliente').slice(0, 80),
      phone: toText(raw['phone']).slice(0, 30),
      email: toText(raw['email']).toLowerCase().slice(0, 120),
      company: toText(raw['company']).slice(0, 100),
      source: source === 'import' || source === 'order' ? source : 'manual',
      createdAt:
        typeof raw['createdAt'] === 'string' && parseTimestamp(raw['createdAt']) !== null
          ? raw['createdAt']
          : new Date().toISOString(),
    };
    const buyerId = toText(raw['buyerId']).slice(0, 120);
    if (buyerId) record.buyerId = buyerId;

    records.push(record);
    seen.add(id);
    if (records.length >= MAX_STORED_CLIENTS) break;
  }
  return records;
}

let clientSequence = 0;

/** Crea un registro local con id único y datos normalizados. */
export function createCompanyClientRecord(
  payload: CreateCompanyClientPayload,
  source: CompanyClientSource,
  now: Date = new Date(),
): CompanyClientRecord {
  clientSequence += 1;
  const record: CompanyClientRecord = {
    id: `cc-${now.getTime().toString(36)}-${clientSequence.toString(36)}`,
    name: payload.name.trim().slice(0, 80) || 'Cliente',
    phone: (payload.phone ?? '').trim().slice(0, 30),
    email: (payload.email ?? '').trim().toLowerCase().slice(0, 120),
    company: (payload.company ?? '').trim().slice(0, 100),
    source,
    createdAt: now.toISOString(),
  };
  const buyerId = payload.buyerId?.trim().slice(0, 120);
  if (buyerId) record.buyerId = buyerId;
  return record;
}

/** Evita duplicados por comprador, correo o teléfono (o nombre sin contacto). */
export function findDuplicateCompanyClient(
  records: readonly CompanyClientRecord[],
  candidate: CompanyClientRecord,
): boolean {
  const buyerId = candidate.buyerId?.trim();
  if (buyerId && records.some((record) => record.buyerId === buyerId)) return true;

  const email = candidate.email.trim().toLowerCase();
  if (email && records.some((record) => record.email.toLowerCase() === email)) return true;

  const phone = normalizePhone(candidate.phone);
  if (phone.length >= 6 && records.some((record) => normalizePhone(record.phone) === phone)) {
    return true;
  }

  const name = normalizeCompanyClientSearch(candidate.name);
  if (!buyerId && !email && phone.length < 6 && name) {
    return records.some(
      (record) =>
        !record.buyerId &&
        !record.email &&
        normalizePhone(record.phone).length < 6 &&
        normalizeCompanyClientSearch(record.name) === name,
    );
  }
  return false;
}

function normalizeHeader(value: string): string {
  return normalizeCompanyClientSearch(value)
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
export function parseCompanyClientsCsv(text: string): CompanyClientCsvParseResult {
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

  const rows: CompanyClientImportRow[] = [];
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
