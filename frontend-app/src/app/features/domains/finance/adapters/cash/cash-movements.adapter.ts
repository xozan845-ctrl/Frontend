import { CASH_MAX_RECORDS, CASH_USD_RATE } from '../../constants/finance.constants';
import type {
  CashCurrency,
  CashKpis,
  CashLedgerEntry,
  CashMovement,
  CashMovementCategory,
  CashMovementFilters,
  CashMovementSource,
  CashMovementStatus,
  CashMovementType,
  CashSaleInput,
  CreateCashMovementPayload,
} from '../../models/finance.model';

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

const TYPE_VALUES: readonly CashMovementType[] = ['ingreso', 'egreso'];
const STATUS_VALUES: readonly CashMovementStatus[] = ['completado', 'anulado'];
const CURRENCY_VALUES: readonly CashCurrency[] = ['NIO', 'USD'];
const CATEGORY_VALUES: readonly CashMovementCategory[] = [
  'venta',
  'compra',
  'gasto',
  'aporte',
  'retiro',
  'ajuste',
  'transferencia',
  'otro',
];
const SOURCE_VALUES: readonly CashMovementSource[] = [
  'venta',
  'compra',
  'gasto',
  'manual',
  'transferencia',
  'ajuste',
];

const LINKED_SOURCES: readonly CashMovementSource[] = ['venta', 'compra', 'gasto'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function toText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/** Fecha local `yyyy-mm-dd` válida; cadena vacía si no lo es. */
export function toCashDate(value: unknown): string {
  const text = toText(value);
  if (!DATE_ONLY.test(text)) return '';
  const date = new Date(`${text}T12:00:00`);
  return Number.isNaN(date.getTime()) ? '' : text;
}

function toNumber(value: unknown): number {
  const parsed = typeof value === 'string' ? Number(value.replace(',', '.')) : value;
  return typeof parsed === 'number' && Number.isFinite(parsed) ? parsed : 0;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function includes<T extends string>(values: readonly T[], value: unknown): value is T {
  return typeof value === 'string' && values.includes(value as T);
}

function isPositiveAmount(value: unknown): number {
  const amount = toNumber(value);
  return Number.isFinite(amount) && amount > 0 ? round(amount) : 0;
}

export function cashDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
}

export function cashToday(now: Date = new Date()): string {
  return cashDateKey(now);
}

export function createCashMovementId(prefix = 'cash'): string {
  const random = globalThis.crypto?.randomUUID?.();
  if (random) return `${prefix}-${random}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/* -------------------------------------------------------------------------- */
/* Saneamiento y alta                                                         */
/* -------------------------------------------------------------------------- */

function adaptCashMovement(raw: Record<string, unknown>): CashMovement | null {
  const id = toText(raw['id']);
  const date = toCashDate(raw['date']);
  const concept = toText(raw['concept']);
  const type = raw['type'];
  const amount = isPositiveAmount(raw['amount']);
  if (!id || !date || !concept || !includes(TYPE_VALUES, type) || amount === 0) return null;

  const currency = includes(CURRENCY_VALUES, raw['currency']) ? raw['currency'] : 'NIO';
  const originalAmount = isPositiveAmount(raw['originalAmount']) || amount;
  const exchangeRate = isPositiveAmount(raw['exchangeRate']) || 1;
  const paymentMethod = toText(raw['paymentMethod']) || 'efectivo';
  const category = includes(CATEGORY_VALUES, raw['category'])
    ? raw['category']
    : type === 'ingreso'
      ? 'aporte'
      : 'gasto';
  const source = includes(SOURCE_VALUES, raw['source']) ? raw['source'] : 'manual';
  const status = includes(STATUS_VALUES, raw['status']) ? raw['status'] : 'completado';
  const createdAt = toText(raw['createdAt']) || `${date}T12:00:00.000Z`;

  return {
    id,
    date,
    createdAt,
    type,
    concept,
    amount,
    currency,
    originalAmount,
    exchangeRate,
    paymentMethod,
    category,
    source,
    status,
    reference: toText(raw['reference']),
    observations: toText(raw['observations']),
    transferId: toText(raw['transferId']) || undefined,
  };
}

/** Normaliza movimientos persistidos y descarta registros inválidos. */
export function sanitizeCashMovements(value: unknown): CashMovement[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (isRecord(item) ? adaptCashMovement(item) : null))
    .filter((item): item is CashMovement => item !== null)
    .slice(0, CASH_MAX_RECORDS);
}

/**
 * Crea un movimiento manual. Si la moneda es USD, `payload.amount` se
 * interpreta en dólares y se consolida en NIO con el tipo de cambio indicado.
 */
export function createCashMovementRecord(
  payload: CreateCashMovementPayload,
  now: Date = new Date(),
): CashMovement | null {
  const date = toCashDate(payload.date);
  const concept = toText(payload.concept);
  const type = payload.type;
  const inputAmount = isPositiveAmount(payload.amount);
  const paymentMethod = toText(payload.paymentMethod);
  if (!date || !concept || !includes(TYPE_VALUES, type) || inputAmount === 0) return null;
  if (!paymentMethod) return null;

  const currency: CashCurrency = payload.currency === 'USD' ? 'USD' : 'NIO';
  const exchangeRate =
    currency === 'USD' ? isPositiveAmount(payload.exchangeRate) || CASH_USD_RATE : 1;
  const originalAmount = isPositiveAmount(payload.originalAmount) || inputAmount;
  const amount = currency === 'USD' ? round(inputAmount * exchangeRate) : inputAmount;

  const category = includes(CATEGORY_VALUES, payload.category)
    ? payload.category
    : type === 'ingreso'
      ? 'aporte'
      : 'gasto';
  const source = includes(SOURCE_VALUES, payload.source) ? payload.source : 'manual';

  return {
    id: createCashMovementId(),
    date,
    createdAt: now.toISOString(),
    type,
    concept,
    amount,
    currency,
    originalAmount,
    exchangeRate,
    paymentMethod,
    category,
    source,
    status: 'completado',
    reference: toText(payload.reference),
    observations: toText(payload.observations),
  };
}

/** Convierte ventas cobradas en movimientos de caja sin persistirlas. */
export function salesToCashMovements(sales: readonly CashSaleInput[]): CashMovement[] {
  return sales
    .filter((sale) => !sale.cancelled && sale.total > 0 && DATE_ONLY.test(sale.date))
    .map((sale) => ({
      id: `sale-${sale.source}-${sale.id}`,
      date: sale.date,
      createdAt: `${sale.date}T12:00:00.000Z`,
      type: 'ingreso' as const,
      concept: `Venta ${sale.number}`,
      amount: round(sale.total),
      currency: 'NIO' as const,
      originalAmount: round(sale.total),
      exchangeRate: 1,
      paymentMethod: normalizePaymentMethodId(sale.paymentMethod, sale.paymentLabel),
      category: 'venta' as const,
      source: 'venta' as const,
      status: 'completado' as const,
      reference: sale.number,
      observations: '',
    }));
}

/** Normaliza la forma de pago de una venta al id de un método de caja. */
export function normalizePaymentMethodId(value: string, label = ''): string {
  const normalized = `${value} ${label}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
  if (normalized.includes('efectivo')) return 'efectivo';
  if (normalized.includes('tarjeta')) return 'tarjeta';
  if (normalized.includes('transferencia')) return 'transferencia';
  if (normalized.includes('paypal')) return 'paypal';
  if (normalized.includes('credito') || normalized.includes('separado')) return 'credito';
  return 'otro';
}

/** Une movimientos manuales y ventas, sin duplicar ids. */
export function mergeCashMovements(
  manual: readonly CashMovement[],
  external: readonly CashMovement[],
): CashMovement[] {
  const seen = new Set<string>();
  const merged: CashMovement[] = [];
  for (const movement of [...manual, ...external]) {
    if (seen.has(movement.id)) continue;
    seen.add(movement.id);
    merged.push(movement);
  }
  return merged.sort(compareMovementsDesc).slice(0, CASH_MAX_RECORDS);
}

/* -------------------------------------------------------------------------- */
/* Orden, libro y filtros                                                     */
/* -------------------------------------------------------------------------- */

function movementTimestamp(movement: CashMovement): string {
  return `${movement.date}T${movement.createdAt.slice(11, 23) || '12:00:00.000'}`;
}

function compareMovementsDesc(a: CashMovement, b: CashMovement): number {
  const byDate = movementTimestamp(b).localeCompare(movementTimestamp(a));
  return byDate !== 0 ? byDate : b.id.localeCompare(a.id);
}

function compareMovementsAsc(a: CashMovement, b: CashMovement): number {
  return -compareMovementsDesc(a, b);
}

/** Libro ascendente con saldo corrido; solo incluye movimientos completados. */
export function buildCashLedger(movements: readonly CashMovement[]): CashLedgerEntry[] {
  let balance = 0;
  return movements
    .filter((movement) => movement.status === 'completado')
    .slice()
    .sort(compareMovementsAsc)
    .map((movement) => {
      balance = round(balance + (movement.type === 'ingreso' ? movement.amount : -movement.amount));
      return { movement, balance };
    });
}

/** Libro descendente (más reciente primero) conservando el saldo histórico. */
export function buildCashLedgerDesc(movements: readonly CashMovement[]): CashLedgerEntry[] {
  return buildCashLedger(movements).slice().reverse();
}

export function cashBalance(movements: readonly CashMovement[]): number {
  return movements
    .filter((movement) => movement.status === 'completado')
    .reduce(
      (total, movement) =>
        total + (movement.type === 'ingreso' ? movement.amount : -movement.amount),
      0,
    );
}

function startOfWeek(date: Date): Date {
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + diff);
}

export function isCashDateInPeriod(
  date: string,
  period: CashMovementFilters['period'],
  customFrom = '',
  customTo = '',
  now: Date = new Date(),
): boolean {
  if (!DATE_ONLY.test(date)) return false;
  if (period === 'hoy') return date === cashDateKey(now);
  if (period === 'semana') {
    const start = cashDateKey(startOfWeek(now));
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 6);
    return date >= start && date <= cashDateKey(end);
  }
  if (period === 'mes') {
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return date.startsWith(month);
  }
  if (period === 'año') return date.startsWith(`${now.getFullYear()}-`);
  const from = toCashDate(customFrom);
  const to = toCashDate(customTo);
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}

function matchesOrigin(movement: CashMovement, origin: CashMovementFilters['origin']): boolean {
  if (origin === 'todos') return true;
  if (origin === 'ligados') return LINKED_SOURCES.includes(movement.source);
  return !LINKED_SOURCES.includes(movement.source);
}

function matchesSearch(movement: CashMovement, search: string): boolean {
  const query = search.trim().toLowerCase();
  if (!query) return true;
  return [
    movement.concept,
    movement.reference,
    movement.observations,
    movement.category,
    movement.paymentMethod,
  ]
    .join(' ')
    .toLowerCase()
    .includes(query);
}

/** Aplica los filtros del reporte a una lista de movimientos. */
export function filterCashMovements(
  movements: readonly CashMovement[],
  filters: CashMovementFilters,
  now: Date = new Date(),
): CashMovement[] {
  return movements.filter((movement) => {
    if (filters.status === 'anulados' && movement.status !== 'anulado') return false;
    if (filters.status === 'completados' && movement.status !== 'completado') return false;
    if (
      !isCashDateInPeriod(movement.date, filters.period, filters.customFrom, filters.customTo, now)
    ) {
      return false;
    }
    if (filters.flow === 'ingresos' && movement.type !== 'ingreso') return false;
    if (filters.flow === 'egresos' && movement.type !== 'egreso') return false;
    if (!matchesOrigin(movement, filters.origin)) return false;
    if (filters.paymentMethod !== 'todas' && movement.paymentMethod !== filters.paymentMethod) {
      return false;
    }
    if (filters.category !== 'todas' && movement.category !== filters.category) return false;
    return matchesSearch(movement, filters.search);
  });
}

/** Filtra el libro sin perder el saldo corrido histórico de cada fila. */
export function filterCashLedger(
  ledger: readonly CashLedgerEntry[],
  filters: CashMovementFilters,
  now: Date = new Date(),
): CashLedgerEntry[] {
  return ledger.filter((entry) => {
    const movement = entry.movement;
    if (
      !isCashDateInPeriod(movement.date, filters.period, filters.customFrom, filters.customTo, now)
    ) {
      return false;
    }
    if (filters.flow === 'ingresos' && movement.type !== 'ingreso') return false;
    if (filters.flow === 'egresos' && movement.type !== 'egreso') return false;
    if (!matchesOrigin(movement, filters.origin)) return false;
    if (filters.paymentMethod !== 'todas' && movement.paymentMethod !== filters.paymentMethod) {
      return false;
    }
    if (filters.category !== 'todas' && movement.category !== filters.category) return false;
    return matchesSearch(movement, filters.search);
  });
}

/* -------------------------------------------------------------------------- */
/* KPIs                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Indicadores del encabezado. «Otros» agrupa movimientos manuales y ajustes,
 * es decir, todo lo que no proviene de ventas, compras o gastos.
 */
export function computeCashKpis(
  movements: readonly CashMovement[],
  now: Date = new Date(),
): CashKpis {
  const completed = movements.filter((movement) => movement.status === 'completado');
  let monthIncome = 0;
  let monthExpense = 0;
  let monthIncomeCount = 0;
  let monthExpenseCount = 0;
  let monthMovements = 0;
  let otherIncome = 0;
  let otherExpense = 0;

  for (const movement of completed) {
    if (!isCashDateInPeriod(movement.date, 'mes', '', '', now)) continue;
    monthMovements += 1;
    if (movement.type === 'ingreso') {
      monthIncome += movement.amount;
      monthIncomeCount += 1;
      if (movement.source === 'manual' || movement.source === 'ajuste')
        otherIncome += movement.amount;
    } else {
      monthExpense += movement.amount;
      monthExpenseCount += 1;
      if (movement.source === 'manual' || movement.source === 'ajuste')
        otherExpense += movement.amount;
    }
  }

  return {
    available: round(cashBalance(completed)),
    monthIncome: round(monthIncome),
    monthIncomeCount,
    monthExpense: round(monthExpense),
    monthExpenseCount,
    monthMovements,
    otherIncome: round(otherIncome),
    otherExpense: round(otherExpense),
  };
}

/** Suma ingresos y egresos de una lista ya filtrada. */
export function summarizeCashMovements(movements: readonly CashMovement[]): {
  income: number;
  expense: number;
} {
  let income = 0;
  let expense = 0;
  for (const movement of movements) {
    if (movement.type === 'ingreso') income += movement.amount;
    else expense += movement.amount;
  }
  return { income: round(income), expense: round(expense) };
}
