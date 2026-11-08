import { unwrapApiListResponse } from '@core/models/api-response.dto';
import { CLIENT_ACTIVE_DAYS, CLIENT_FREQUENT_ORDERS } from '../../constants/clients.constants';
import type {
  Client,
  ClientChip,
  ClientKpis,
  ClientOrder,
  ClientRecord,
  ClientSource,
  ClientsTab,
  ClientStatus,
  CreateClientPayload,
} from '../../models/client.model';
import type { OrderAggregate } from '../../models/client.types';

const DAY_MS = 86_400_000;
const MAX_STORED_CLIENTS = 2_000;
const EXCLUDED_ORDER_STATUSES = new Set(['cancelada', 'cancelled', 'devuelta', 'returned']);

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

function toNumber(value: unknown, fallback = 0): number {
  if (value === null || value === undefined || value === '') return fallback;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function adaptClientOrder(raw: unknown): ClientOrder | null {
  if (!isRecord(raw)) return null;
  const id = raw['id'] ?? raw['_id'] ?? raw['orden_id'] ?? raw['order_id'];
  if (id === null || id === undefined || id === '') return null;

  const buyerId =
    raw['comprador_id'] ??
    raw['compradorId'] ??
    raw['buyerId'] ??
    raw['cliente_id'] ??
    raw['clienteId'];
  const totalValue = raw['total'] ?? raw['amount'];
  const total =
    totalValue !== null && totalValue !== undefined
      ? toNumber(totalValue)
      : toNumber(raw['total_cents']) / 100;

  return {
    id: String(id),
    ...(buyerId !== null && buyerId !== undefined && buyerId !== ''
      ? { buyerId: String(buyerId) }
      : {}),
    status: toText(raw['estado'] ?? raw['status'], 'creada'),
    total: roundMoney(total),
    createdAt: toText(raw['creado_en'] ?? raw['createdAt'] ?? raw['fecha']),
  };
}

/** Normaliza las órdenes del endpoint de empresa o vendedor. */
export function adaptClientOrdersFromBackend(response: unknown): ClientOrder[] {
  return unwrapApiListResponse<unknown>(response)
    .map((raw) => adaptClientOrder(raw))
    .filter((order): order is ClientOrder => order !== null);
}

function startOfMonth(now: Date): number {
  return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
}

/** Normaliza texto para búsquedas sin distinguir mayúsculas ni acentos. */
export function normalizeClientSearch(value: string): string {
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
export function clientFallbackName(buyerId: string): string {
  const visibleId = buyerId.length > 8 ? buyerId.slice(-8) : buyerId;
  return `Cliente ${visibleId.toUpperCase()}`;
}

function statusFor(
  ordersCount: number,
  isActive: boolean,
  isNew: boolean,
  isFrequent: boolean,
): ClientStatus {
  if (ordersCount === 0) return 'sin_compras';
  if (!isActive) return 'inactivo';
  if (isNew) return 'nuevo';
  if (isFrequent) return 'frecuente';
  return 'activo';
}

function toClient(base: ClientRecord, aggregate: OrderAggregate | null, now: Date): Client {
  const ordersCount = aggregate?.ordersCount ?? 0;
  const totalSpent = aggregate ? roundMoney(aggregate.totalSpent) : 0;
  const firstPurchaseAt = aggregate?.firstPurchaseAt ?? null;
  const lastPurchaseAt = aggregate?.lastPurchaseAt ?? null;
  const createdAt = aggregate?.firstPurchaseAt ?? base.createdAt;
  const createdMs = parseTimestamp(createdAt);
  const lastPurchaseMs = parseTimestamp(lastPurchaseAt);
  const isActive =
    lastPurchaseMs !== null && now.getTime() - lastPurchaseMs <= CLIENT_ACTIVE_DAYS * DAY_MS;
  const isNew = createdMs !== null && createdMs >= startOfMonth(now);
  const isFrequent = ordersCount >= CLIENT_FREQUENT_ORDERS;
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
export function buildClients(
  orders: readonly ClientOrder[],
  localClients: readonly ClientRecord[],
  now: Date = new Date(),
): Client[] {
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

  const localByBuyer = new Map<string, ClientRecord>();
  const standaloneLocal: ClientRecord[] = [];
  for (const record of localClients) {
    const buyerId = record.buyerId?.trim();
    if (buyerId) {
      if (!localByBuyer.has(buyerId)) localByBuyer.set(buyerId, record);
    } else {
      standaloneLocal.push(record);
    }
  }

  const clients: Client[] = [];
  for (const aggregate of aggregates.values()) {
    const local = localByBuyer.get(aggregate.buyerId);
    localByBuyer.delete(aggregate.buyerId);

    clients.push(
      toClient(
        {
          id: local?.id ?? `buyer-${aggregate.buyerId}`,
          buyerId: aggregate.buyerId,
          name: local?.name || clientFallbackName(aggregate.buyerId),
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
    clients.push(toClient(record, null, now));
  }

  return clients.sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
}

/** Indicadores de la cartera completa (no dependen de filtros ni paginación). */
export function computeClientKpis(clients: readonly Client[]): ClientKpis {
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
export function filterClientsByTab(clients: readonly Client[], tab: ClientsTab): Client[] {
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
export function filterClientsByChip(clients: readonly Client[], chip: ClientChip): Client[] {
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
export function searchClients(clients: readonly Client[], query: string): Client[] {
  const normalizedQuery = normalizeClientSearch(query);
  if (!normalizedQuery) return [...clients];

  const digits = normalizePhone(query);
  return clients.filter((client) => {
    const haystack = normalizeClientSearch(
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
export function sanitizeClientRecords(value: unknown): ClientRecord[] {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  const records: ClientRecord[] = [];
  for (const raw of value) {
    if (!isRecord(raw)) continue;
    const id = toText(raw['id']);
    if (!id || seen.has(id)) continue;

    const source = raw['source'];
    const record: ClientRecord = {
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
export function createClientRecord(
  payload: CreateClientPayload,
  source: ClientSource,
  now: Date = new Date(),
): ClientRecord {
  clientSequence += 1;
  const record: ClientRecord = {
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
export function findDuplicateClient(
  records: readonly ClientRecord[],
  candidate: ClientRecord,
): boolean {
  const buyerId = candidate.buyerId?.trim();
  if (buyerId && records.some((record) => record.buyerId === buyerId)) return true;

  const email = candidate.email.trim().toLowerCase();
  if (email && records.some((record) => record.email.toLowerCase() === email)) return true;

  const phone = normalizePhone(candidate.phone);
  if (phone.length >= 6 && records.some((record) => normalizePhone(record.phone) === phone)) {
    return true;
  }

  const name = normalizeClientSearch(candidate.name);
  if (!buyerId && !email && phone.length < 6 && name) {
    return records.some(
      (record) =>
        !record.buyerId &&
        !record.email &&
        normalizePhone(record.phone).length < 6 &&
        normalizeClientSearch(record.name) === name,
    );
  }
  return false;
}
