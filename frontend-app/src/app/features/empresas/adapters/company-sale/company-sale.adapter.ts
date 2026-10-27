import { orderStatusLabel, type OrderResponse } from '../../../cart/public-api';
import {
  COMPANY_SALE_DEFAULT_PROVIDER,
  COMPANY_SALE_MAX_RECORDS,
  COMPANY_SALE_PAYMENT_LABELS,
  COMPANY_SALE_PAYMENT_METHODS,
  COMPANY_SALE_RECURRING_DAYS,
  COMPANY_SALE_RECURRING_ORDERS,
} from '../../constants/company-sales.constants';
import { clientFallbackName, type Client } from '../../../clients/public-api';
import type { BuildCompanySaleRowsInput } from '../../models/company-sale.types';
import type {
  CompanyRecurringClient,
  CompanySaleClientDraft,
  CompanySaleFilters,
  CompanySaleKpis,
  CompanySaleLine,
  CompanySaleLineKind,
  CompanySalePaymentGroup,
  CompanySalePaymentMethod,
  CompanySalePeriod,
  CompanySaleRecord,
  CompanySaleRow,
  CompanySaleStatus,
  CreateCompanySalePayload,
} from '../../models/company-sale.model';

const DAY_MS = 86_400_000;
const PAYMENT_METHODS = new Set<CompanySalePaymentMethod>(
  COMPANY_SALE_PAYMENT_METHODS.map((method) => method.value),
);
const CANCELED_ORDER_STATUSES = new Set(['cancelada', 'cancelled', 'devuelta', 'returned']);
const PENDING_ORDER_STATUSES = new Set(['creada', 'pendiente', 'en_preparacion']);
const PAID_ORDER_STATUSES = new Set(['pagada', 'enviada', 'entregada']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function toText(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function toNumber(value: unknown, fallback = 0): number {
  if (value === null || value === undefined || value === '') return fallback;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function parseTimestamp(value: string | null | undefined): number | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function startOfWeek(date: Date): number {
  const today = startOfDay(date);
  const weekday = (date.getDay() + 6) % 7;
  return today - weekday * DAY_MS;
}

function normalizeSearch(value: string | null | undefined): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es')
    .trim();
}

/** Etiqueta legible de una forma de pago. */
export function companySalePaymentLabel(method: CompanySalePaymentMethod): string {
  return COMPANY_SALE_PAYMENT_LABELS[method];
}

/** Rango temporal del periodo seleccionado. */
export function companySalePeriodRange(
  period: CompanySalePeriod,
  customFrom: string,
  customTo: string,
  now: Date = new Date(),
): { from: number; to: number } {
  if (period === 'today') {
    const from = startOfDay(now);
    return { from, to: from + DAY_MS - 1 };
  }
  if (period === 'week') {
    const from = startOfWeek(now);
    return { from, to: from + 7 * DAY_MS - 1 };
  }
  if (period === 'month') {
    const from = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime() - 1;
    return { from, to };
  }
  if (period === 'year') {
    const from = new Date(now.getFullYear(), 0, 1).getTime();
    const to = new Date(now.getFullYear() + 1, 0, 1).getTime() - 1;
    return { from, to };
  }

  const fromDate = customFrom ? new Date(`${customFrom}T00:00:00`) : null;
  const toDate = customTo ? new Date(`${customTo}T23:59:59.999`) : null;
  return {
    from: fromDate && !Number.isNaN(fromDate.getTime()) ? fromDate.getTime() : -Infinity,
    to: toDate && !Number.isNaN(toDate.getTime()) ? toDate.getTime() : Infinity,
  };
}

function sanitizeLine(raw: unknown): CompanySaleLine | null {
  if (!isRecord(raw)) return null;
  const kind: CompanySaleLineKind = raw['kind'] === 'service' ? 'service' : 'product';
  const name = toText(raw['name']);
  const quantity = Math.trunc(toNumber(raw['quantity']));
  const unitPrice = roundMoney(toNumber(raw['unitPrice']));
  if (!name || quantity <= 0 || unitPrice < 0) return null;

  return {
    id: toText(raw['id'], `line-${name}-${quantity}`),
    kind,
    ...(toText(raw['referenceId']) ? { referenceId: toText(raw['referenceId']) } : {}),
    code: toText(raw['code']),
    name,
    quantity,
    unitPrice,
    subtotal: roundMoney(quantity * unitPrice),
  };
}

function sanitizeRecord(raw: unknown): CompanySaleRecord | null {
  if (!isRecord(raw)) return null;
  const id = toText(raw['id']);
  const number = toText(raw['number']);
  const lines = (Array.isArray(raw['lines']) ? raw['lines'] : [])
    .map((line) => sanitizeLine(line))
    .filter((line): line is CompanySaleLine => line !== null);
  if (!id || !number || lines.length === 0) return null;

  const createdAt = toText(raw['createdAt']);
  if (parseTimestamp(createdAt) === null) return null;

  const paymentMethod = toText(raw['paymentMethod']) as CompanySalePaymentMethod;
  if (!PAYMENT_METHODS.has(paymentMethod)) return null;

  const subtotal = roundMoney(lines.reduce((sum, line) => sum + line.subtotal, 0));
  const discount = roundMoney(Math.min(Math.max(toNumber(raw['discount']), 0), subtotal));
  const total = roundMoney(subtotal - discount);
  if (total <= 0) return null;

  const status: CompanySaleStatus = raw['status'] === 'pendiente' ? 'pendiente' : 'pagada';

  return {
    id,
    number,
    createdAt,
    clientId: toText(raw['clientId']) || null,
    clientName: toText(raw['clientName'], 'Consumidor final'),
    phone: toText(raw['phone']),
    email: toText(raw['email']),
    company: toText(raw['company']),
    paymentMethod,
    status,
    lines,
    subtotal,
    discount,
    total,
    profit: roundMoney(Math.max(toNumber(raw['profit']), 0)),
    notes: toText(raw['notes']),
    providerName: toText(raw['providerName'], COMPANY_SALE_DEFAULT_PROVIDER),
  };
}

/** Lee y normaliza las ventas locales; descarta registros corruptos. */
export function sanitizeCompanySaleRecords(raw: unknown): CompanySaleRecord[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .slice(0, COMPANY_SALE_MAX_RECORDS)
    .map((record) => sanitizeRecord(record))
    .filter((record): record is CompanySaleRecord => record !== null);
}

function clientFromDraft(client: CompanySaleClientDraft): {
  clientId: string | null;
  clientName: string;
  phone: string;
  email: string;
  company: string;
} | null {
  if (client.mode === 'final') {
    return { clientId: null, clientName: 'Consumidor final', phone: '', email: '', company: '' };
  }
  const clientName = toText(client.name);
  if (!clientName) return null;
  return {
    clientId: toText(client.clientId) || null,
    clientName,
    phone: toText(client.phone),
    email: toText(client.email),
    company: toText(client.company),
  };
}

/** Construye una venta local validada; `null` si el payload no es válido. */
export function createCompanySaleRecord(
  payload: CreateCompanySalePayload,
  context: { id: string; number: string; now: string; providerName: string },
): CompanySaleRecord | null {
  const client = clientFromDraft(payload.client);
  if (!client) return null;

  const lines = payload.lines
    .map((line) => sanitizeLine(line))
    .filter((line): line is CompanySaleLine => line !== null);
  if (lines.length === 0) return null;

  const subtotal = roundMoney(lines.reduce((sum, line) => sum + line.subtotal, 0));
  if (subtotal <= 0) return null;

  const discountPercent = Math.min(Math.max(toNumber(payload.discountPercent), 0), 100);
  const discount = roundMoney((subtotal * discountPercent) / 100);
  const total = roundMoney(subtotal - discount);
  if (total <= 0) return null;

  const date = parseTimestamp(payload.date);
  const createdAt = date === null ? context.now : new Date(date).toISOString();
  const paymentMethod = PAYMENT_METHODS.has(payload.paymentMethod)
    ? payload.paymentMethod
    : 'efectivo';

  return {
    id: context.id,
    number: context.number,
    createdAt,
    ...client,
    paymentMethod,
    status: paymentMethod === 'separado' ? 'pendiente' : 'pagada',
    lines,
    subtotal,
    discount,
    total,
    profit: 0,
    notes: toText(payload.notes),
    providerName: toText(context.providerName, COMPANY_SALE_DEFAULT_PROVIDER),
  };
}

/** Siguiente folio local (`V-000001`). */
export function nextCompanySaleNumber(records: readonly CompanySaleRecord[]): string {
  const highest = records.reduce((max, record) => {
    const match = /^V-(\d+)$/i.exec(record.number);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return `V-${String(highest + 1).padStart(6, '0')}`;
}

function orderPaymentGroup(status: string): CompanySalePaymentGroup {
  const normalized = status.toLowerCase();
  if (PAID_ORDER_STATUSES.has(normalized)) return 'cash';
  if (PENDING_ORDER_STATUSES.has(normalized)) return 'pending';
  return 'pending';
}

function localPaymentGroup(
  method: CompanySalePaymentMethod,
  status: CompanySaleStatus,
): CompanySalePaymentGroup {
  if (method === 'separado' || status === 'pendiente') return 'credit';
  return 'cash';
}

function orderProductsLabel(order: OrderResponse): string {
  const names = (order.items ?? [])
    .map((item) => item.name?.trim())
    .filter((name): name is string => !!name);
  if (names.length > 0) return names.join(', ');
  if (order.items?.length) return `${order.items.length} producto(s)`;
  return '—';
}

function localProductsLabel(record: CompanySaleRecord): string {
  return record.lines.map((line) => line.name).join(', ');
}

/** Combina las órdenes del backend con las ventas locales en filas de historial. */
export function buildCompanySaleRows(input: BuildCompanySaleRowsInput): CompanySaleRow[] {
  const clientsByBuyer = new Map<string, Client>();
  for (const client of input.clients) {
    if (client.buyerId) clientsByBuyer.set(client.buyerId, client);
  }

  const storesById = new Map(input.stores.map((store) => [store.id, store]));
  const profitByOrder = new Map(
    (input.salesAccount?.sales ?? []).map((sale) => [sale.orderId, sale.companyAmount]),
  );

  const orderRows: CompanySaleRow[] = input.orders.map((order) => {
    const buyerId = order.buyerId?.trim() ?? '';
    const client = buyerId ? clientsByBuyer.get(buyerId) : undefined;
    const store = order.storeId ? storesById.get(order.storeId) : undefined;

    return {
      id: `order-${order.id}`,
      number: order.orderNumber,
      date: order.createdAt,
      clientName: client?.name ?? (buyerId ? clientFallbackName(buyerId) : 'Consumidor final'),
      paymentLabel: 'No registrado',
      paymentGroup: orderPaymentGroup(order.status),
      productsLabel: orderProductsLabel(order),
      providerName: store?.name ?? COMPANY_SALE_DEFAULT_PROVIDER,
      total: roundMoney(order.total),
      profit: roundMoney(profitByOrder.get(String(order.id)) ?? 0),
      status: order.status,
      statusLabel: orderStatusLabel(order.status),
      source: 'order',
    };
  });

  const localRows: CompanySaleRow[] = input.localSales.map((record) => ({
    id: record.id,
    number: record.number,
    date: record.createdAt,
    clientName: record.clientName,
    paymentLabel: companySalePaymentLabel(record.paymentMethod),
    paymentGroup: localPaymentGroup(record.paymentMethod, record.status),
    productsLabel: localProductsLabel(record),
    providerName: record.providerName,
    total: record.total,
    profit: record.profit,
    status: record.status,
    statusLabel: record.status === 'pendiente' ? 'Pendiente' : 'Pagada',
    source: 'local',
  }));

  return [...localRows, ...orderRows].sort(
    (a, b) => (parseTimestamp(b.date) ?? 0) - (parseTimestamp(a.date) ?? 0),
  );
}

/** Aplica periodo, forma de pago y búsqueda al historial. */
export function filterCompanySaleRows(
  rows: readonly CompanySaleRow[],
  filters: CompanySaleFilters,
): CompanySaleRow[] {
  const { from, to } = companySalePeriodRange(
    filters.period,
    filters.customFrom,
    filters.customTo,
    filters.now,
  );
  const term = normalizeSearch(filters.search);

  return rows.filter((row) => {
    const timestamp = parseTimestamp(row.date);
    if (timestamp === null || timestamp < from || timestamp > to) return false;
    if (filters.payment === 'cash' && row.paymentGroup !== 'cash') return false;
    if (filters.payment === 'credit' && row.paymentGroup !== 'credit') return false;
    if (
      filters.payment === 'pending' &&
      row.paymentGroup !== 'credit' &&
      row.paymentGroup !== 'pending'
    ) {
      return false;
    }
    if (!term) return true;
    return normalizeSearch(
      `${row.number} ${row.clientName} ${row.providerName} ${row.productsLabel} ${row.paymentLabel}`,
    ).includes(term);
  });
}

/** Calcula los KPIs del encabezado sobre ventas no canceladas. */
export function computeCompanySaleKpis(
  rows: readonly CompanySaleRow[],
  now: Date = new Date(),
): CompanySaleKpis {
  const validRows = rows.filter(
    (row) => !(row.source === 'order' && CANCELED_ORDER_STATUSES.has(row.status.toLowerCase())),
  );
  const todayStart = startOfDay(now);
  const todayEnd = todayStart + DAY_MS;
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime();

  const todaySales = validRows.reduce((sum, row) => {
    const timestamp = parseTimestamp(row.date);
    return timestamp !== null && timestamp >= todayStart && timestamp < todayEnd
      ? sum + row.total
      : sum;
  }, 0);

  const monthRows = validRows.filter((row) => {
    const timestamp = parseTimestamp(row.date);
    return timestamp !== null && timestamp >= monthStart && timestamp < monthEnd;
  });
  const monthSales = roundMoney(monthRows.reduce((sum, row) => sum + row.total, 0));
  const monthCount = monthRows.length;
  const estimatedProfit = roundMoney(monthRows.reduce((sum, row) => sum + row.profit, 0));

  return {
    todaySales: roundMoney(todaySales),
    monthSales,
    monthCount,
    averageTicket: monthCount > 0 ? roundMoney(monthSales / monthCount) : 0,
    estimatedProfit,
  };
}

/** Clientes frecuentes con su próxima fecha estimada de pago. */
export function buildRecurringClients(clients: readonly Client[]): CompanyRecurringClient[] {
  return clients
    .filter((client) => client.ordersCount >= COMPANY_SALE_RECURRING_ORDERS)
    .map((client) => {
      const first = parseTimestamp(client.firstPurchaseAt);
      const last = parseTimestamp(client.lastPurchaseAt);
      let days = COMPANY_SALE_RECURRING_DAYS;
      if (first !== null && last !== null && client.ordersCount > 1) {
        days = Math.max(1, Math.round((last - first) / DAY_MS / (client.ordersCount - 1)));
      }
      const frequencyLabel = days >= 25 && days <= 35 ? 'Mensual' : `Cada ${days} días`;
      const nextPaymentAt = last === null ? null : new Date(last + days * DAY_MS).toISOString();

      return {
        id: client.id,
        name: client.name,
        frequencyLabel,
        lastPaymentAt: client.lastPurchaseAt,
        nextPaymentAt,
        amountDue: client.averageTicket,
        status: client.isActive ? ('Activo' as const) : ('Inactivo' as const),
      };
    })
    .sort((a, b) => {
      const aTime = parseTimestamp(a.nextPaymentAt) ?? Number.MAX_SAFE_INTEGER;
      const bTime = parseTimestamp(b.nextPaymentAt) ?? Number.MAX_SAFE_INTEGER;
      return aTime - bTime;
    })
    .slice(0, 6);
}

/** Crea un id local estable para una venta. */
export function createCompanySaleId(): string {
  const random = globalThis.crypto?.randomUUID?.();
  if (random) return `sale-${random}`;
  return `sale-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
