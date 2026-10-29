import {
  CASH_ACCOUNTS,
  CASH_MAX_RECORDS,
  CASH_PAYMENT_METHODS,
  CASH_SOURCES,
  PETTY_CASH_FUND,
} from '../../constants/cash.constants';
import type {
  CashBankAccountSummary,
  CashDailyClosure,
  CashFilters,
  CashMovement,
  CashMovementCategory,
  CashMovementRow,
  CashMovementSource,
  CashMovementStatus,
  CashMovementType,
  CashPaymentBreakdown,
  CashPaymentMethod,
  CashSummary,
  CreateCashMovementPayload,
} from '../../models/cash.model';

const TYPES: readonly CashMovementType[] = ['ingreso', 'egreso'];
const STATUSES: readonly CashMovementStatus[] = ['confirmado', 'pendiente', 'anulado'];
const PAYMENT_METHODS: readonly CashPaymentMethod[] = [
  'efectivo',
  'tarjeta',
  'transferencia',
  'cheque',
  'credito',
];
const CATEGORIES: readonly CashMovementCategory[] = [
  'venta',
  'cobro',
  'deposito',
  'transferencia',
  'aporte',
  'pago-proveedor',
  'gasto',
  'retiro',
  'caja-chica',
  'ajuste',
  'otro',
];
const SOURCES: readonly CashMovementSource[] = CASH_SOURCES.map((source) => source.value);

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function toText(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function toDate(value: unknown): string {
  const text = toText(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return '';
  const date = new Date(`${text}T00:00:00`);
  return Number.isNaN(date.getTime()) ? '' : text;
}

function toAmount(value: unknown): number {
  const parsed = typeof value === 'string' ? Number(value.replace(',', '.')) : value;
  if (typeof parsed !== 'number' || !Number.isFinite(parsed) || parsed <= 0) return 0;
  return Math.round(parsed * 100) / 100;
}

function isType(value: unknown): value is CashMovementType {
  return typeof value === 'string' && TYPES.includes(value as CashMovementType);
}

function isStatus(value: unknown): value is CashMovementStatus {
  return typeof value === 'string' && STATUSES.includes(value as CashMovementStatus);
}

function isPaymentMethod(value: unknown): value is CashPaymentMethod {
  return typeof value === 'string' && PAYMENT_METHODS.includes(value as CashPaymentMethod);
}

function isCategory(value: unknown): value is CashMovementCategory {
  return typeof value === 'string' && CATEGORIES.includes(value as CashMovementCategory);
}

function isSource(value: unknown): value is CashMovementSource {
  return typeof value === 'string' && SOURCES.includes(value as CashMovementSource);
}

function isKnownAccount(value: string): boolean {
  return CASH_ACCOUNTS.some((account) => account.value === value);
}

function todayLocal(now: Date = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function currentMonth(now: Date): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function startOfWeek(now: Date): Date {
  const day = now.getDay();
  const offset = day === 0 ? 6 : day - 1;
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset);
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

export function createCashId(): string {
  const random = globalThis.crypto?.randomUUID?.();
  if (random) return `cash-${random}`;
  return `cash-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Normaliza el contrato nuevo y migra los movimientos del store anterior. */
export function sanitizeCashMovements(value: unknown): CashMovement[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!isRecord(item)) return null;
      const concept = toText(item['concept'] ?? item['description']);
      const date = toDate(item['date']);
      const amount = toAmount(item['amount']);
      const type = isType(item['type']) ? item['type'] : 'ingreso';
      if (!concept || !date || amount === 0) return null;
      const account = toText(item['account'], 'caja-general');
      return {
        id: toText(item['id']) || createCashId(),
        date,
        type,
        concept,
        category: isCategory(item['category'])
          ? item['category']
          : type === 'ingreso'
            ? 'venta'
            : 'gasto',
        amount,
        paymentMethod: isPaymentMethod(item['paymentMethod']) ? item['paymentMethod'] : 'efectivo',
        status: isStatus(item['status']) ? item['status'] : 'confirmado',
        account: isKnownAccount(account) ? account : 'caja-general',
        source: isSource(item['source']) ? item['source'] : 'manual',
        reference: toText(item['reference']),
        counterpart: toText(item['counterpart']),
        notes: toText(item['notes']),
        createdAt: toText(item['createdAt']) || `${date}T12:00:00.000Z`,
      } satisfies CashMovement;
    })
    .filter((item): item is CashMovement => item !== null)
    .slice(0, CASH_MAX_RECORDS);
}

export function createCashMovement(
  payload: CreateCashMovementPayload,
  now: Date = new Date(),
): CashMovement | null {
  const concept = toText(payload.concept);
  const amount = toAmount(payload.amount);
  const date = toDate(payload.date) || todayLocal(now);
  if (!concept || amount === 0 || !isType(payload.type) || !isCategory(payload.category)) {
    return null;
  }
  const account = isKnownAccount(payload.account) ? payload.account : 'caja-general';
  const source = isSource(payload.source)
    ? payload.source
    : payload.category === 'ajuste'
      ? 'ajuste'
      : 'manual';
  return {
    id: createCashId(),
    date,
    type: payload.type,
    concept,
    category: payload.category,
    amount,
    paymentMethod: isPaymentMethod(payload.paymentMethod) ? payload.paymentMethod : 'efectivo',
    status: 'confirmado',
    account,
    source,
    reference: toText(payload.reference),
    counterpart: toText(payload.counterpart),
    notes: toText(payload.notes),
    createdAt: now.toISOString(),
  };
}

export function updateCashMovement(
  current: CashMovement,
  payload: CreateCashMovementPayload,
): CashMovement | null {
  const concept = toText(payload.concept);
  const amount = toAmount(payload.amount);
  const date = toDate(payload.date) || current.date;
  if (!concept || amount === 0 || !isType(payload.type) || !isCategory(payload.category)) {
    return null;
  }
  const account = isKnownAccount(payload.account) ? payload.account : current.account;
  return {
    ...current,
    date,
    type: payload.type,
    concept,
    category: payload.category,
    amount,
    paymentMethod: isPaymentMethod(payload.paymentMethod) ? payload.paymentMethod : 'efectivo',
    account,
    reference: toText(payload.reference),
    counterpart: toText(payload.counterpart),
    notes: toText(payload.notes),
  };
}

function matchesPeriod(
  date: string,
  period: CashFilters['period'],
  dateFrom: string,
  dateTo: string,
  now: Date,
): boolean {
  if (period === 'today') return date === todayLocal(now);
  if (period === 'week') {
    const start = todayLocal(startOfWeek(now));
    const end = todayLocal(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 6));
    return date >= start && date <= end;
  }
  if (period === 'month') return date.startsWith(currentMonth(now));
  if (period === 'year') return date.startsWith(String(now.getFullYear()));
  if (period === 'custom') {
    const from = toDate(dateFrom);
    const to = toDate(dateTo);
    if (from && date < from) return false;
    if (to && date > to) return false;
    return true;
  }
  return true;
}

function normalizeSearch(value: string): string {
  return value.trim().toLowerCase();
}

export function filterCashMovements(
  records: readonly CashMovement[],
  filters: CashFilters,
  now: Date = new Date(),
): CashMovement[] {
  const search = normalizeSearch(filters.search);
  return records
    .filter((record) => {
      if (!matchesPeriod(record.date, filters.period, filters.dateFrom, filters.dateTo, now)) {
        return false;
      }
      if (filters.type !== 'all' && record.type !== filters.type) return false;
      if (filters.status !== 'all' && record.status !== filters.status) return false;
      if (filters.category !== 'all' && record.category !== filters.category) return false;
      if (filters.paymentMethod !== 'all' && record.paymentMethod !== filters.paymentMethod) {
        return false;
      }
      if (search) {
        const haystack =
          `${record.concept} ${record.category} ${record.counterpart} ${record.reference}`.toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      return true;
    })
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
}

function isConfirmed(record: CashMovement): boolean {
  return record.status === 'confirmado';
}

function isOtherSource(record: CashMovement): boolean {
  return record.source === 'manual' || record.source === 'ajuste';
}

function cashAccountValues(): Set<string> {
  return new Set(
    CASH_ACCOUNTS.filter((account) => account.kind === 'caja').map((account) => account.value),
  );
}

function bankAccountValues(): Set<string> {
  return new Set(
    CASH_ACCOUNTS.filter((account) => account.kind === 'banco').map((account) => account.value),
  );
}

function netOf(records: readonly CashMovement[]): number {
  return records.reduce(
    (total, record) => total + (record.type === 'ingreso' ? record.amount : -record.amount),
    0,
  );
}

export function computeCashSummary(
  records: readonly CashMovement[],
  now: Date = new Date(),
): CashSummary {
  const month = currentMonth(now);
  const cashAccounts = cashAccountValues();
  const bankAccounts = bankAccountValues();
  const confirmed = records.filter(isConfirmed);
  const monthRecords = confirmed.filter((record) => record.date.startsWith(month));
  const cashRecords = confirmed.filter((record) => cashAccounts.has(record.account));
  const bankRecords = confirmed.filter((record) => bankAccounts.has(record.account));
  const pettyRecords = confirmed.filter((record) => record.category === 'caja-chica');

  let incomeMonth = 0;
  let incomeCountMonth = 0;
  let expenseMonth = 0;
  let expenseCountMonth = 0;
  let otherIncome = 0;
  let otherExpense = 0;

  for (const record of monthRecords) {
    if (record.type === 'ingreso') {
      incomeMonth += record.amount;
      incomeCountMonth += 1;
      if (isOtherSource(record)) otherIncome += record.amount;
    } else {
      expenseMonth += record.amount;
      expenseCountMonth += 1;
      if (isOtherSource(record)) otherExpense += record.amount;
    }
  }

  return {
    available: round(netOf(cashRecords)),
    incomeMonth: round(incomeMonth),
    incomeCountMonth,
    expenseMonth: round(expenseMonth),
    expenseCountMonth,
    movementsMonth: monthRecords.length,
    otherIncome: round(otherIncome),
    otherExpense: round(otherExpense),
    pettyCash: round(PETTY_CASH_FUND + netOf(pettyRecords)),
    banks: round(netOf(bankRecords)),
  };
}

export function computePaymentBreakdown(records: readonly CashMovement[]): CashPaymentBreakdown[] {
  const confirmed = records.filter(isConfirmed);
  return CASH_PAYMENT_METHODS.map((method) => {
    const items = confirmed.filter((record) => record.paymentMethod === method.value);
    const income = round(
      items
        .filter((record) => record.type === 'ingreso')
        .reduce((total, record) => total + record.amount, 0),
    );
    const expense = round(
      items
        .filter((record) => record.type === 'egreso')
        .reduce((total, record) => total + record.amount, 0),
    );
    return {
      method: method.value,
      label: method.label,
      income,
      expense,
      net: round(income - expense),
      count: items.length,
    };
  });
}

export function computeDailyClosures(
  records: readonly CashMovement[],
  now: Date = new Date(),
): CashDailyClosure[] {
  const today = todayLocal(now);
  const byDate = new Map<string, CashMovement[]>();
  for (const record of records.filter(isConfirmed)) {
    const items = byDate.get(record.date) ?? [];
    items.push(record);
    byDate.set(record.date, items);
  }
  return [...byDate.entries()]
    .map(([date, items]) => {
      const income = round(
        items
          .filter((record) => record.type === 'ingreso')
          .reduce((total, record) => total + record.amount, 0),
      );
      const expense = round(
        items
          .filter((record) => record.type === 'egreso')
          .reduce((total, record) => total + record.amount, 0),
      );
      return {
        date,
        income,
        expense,
        net: round(income - expense),
        count: items.length,
        status: date < today ? 'cerrado' : 'abierto',
      } satisfies CashDailyClosure;
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function computeBankAccounts(records: readonly CashMovement[]): CashBankAccountSummary[] {
  const confirmed = records.filter(isConfirmed);
  return CASH_ACCOUNTS.filter((account) => account.kind === 'banco').map((account) => {
    const items = confirmed.filter((record) => record.account === account.value);
    const income = round(
      items
        .filter((record) => record.type === 'ingreso')
        .reduce((total, record) => total + record.amount, 0),
    );
    const expense = round(
      items
        .filter((record) => record.type === 'egreso')
        .reduce((total, record) => total + record.amount, 0),
    );
    return {
      account: account.value,
      label: account.label,
      income,
      expense,
      balance: round(income - expense),
      count: items.length,
    };
  });
}

/**
 * Saldo acumulado por movimiento en orden cronológico. Solo los confirmados
 * alteran el saldo; los pendientes y anulados conservan el saldo previo.
 */
export function computeMovementBalances(records: readonly CashMovement[]): Map<string, number> {
  const ordered = [...records].sort(
    (a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt),
  );
  const balances = new Map<string, number>();
  let running = 0;
  for (const record of ordered) {
    if (isConfirmed(record)) {
      running += record.type === 'ingreso' ? record.amount : -record.amount;
    }
    balances.set(record.id, round(running));
  }
  return balances;
}

export function toMovementRows(
  records: readonly CashMovement[],
  balances: ReadonlyMap<string, number>,
): CashMovementRow[] {
  return records.map((record) => ({ record, balance: balances.get(record.id) ?? 0 }));
}

export { todayLocal as cashToday };
