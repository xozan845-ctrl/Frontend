import { EXPENSES_MAX_RECORDS } from '../../constants/expenses.constants';
import type {
  CreateExpensePayload,
  ExpenseFilters,
  ExpensePaymentMethod,
  ExpenseRecord,
  ExpenseStatus,
  ExpenseType,
  ExpensesSummary,
} from '../../models/expense.model';

const TYPES: readonly ExpenseType[] = ['inmediato', 'programado', 'recurrente'];
const STATUSES: readonly ExpenseStatus[] = ['pendiente', 'pagado', 'cancelado'];
const PAYMENT_METHODS: readonly ExpensePaymentMethod[] = [
  'efectivo',
  'tarjeta',
  'transferencia',
  'credito',
];

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

function toRetention(value: unknown): number {
  const parsed = typeof value === 'string' ? Number(value.replace(',', '.')) : value;
  if (typeof parsed !== 'number' || !Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.round(parsed * 100) / 100;
}

function isType(value: unknown): value is ExpenseType {
  return typeof value === 'string' && TYPES.includes(value as ExpenseType);
}

function isStatus(value: unknown): value is ExpenseStatus {
  return typeof value === 'string' && STATUSES.includes(value as ExpenseStatus);
}

function isPaymentMethod(value: unknown): value is ExpensePaymentMethod {
  return typeof value === 'string' && PAYMENT_METHODS.includes(value as ExpensePaymentMethod);
}

function todayLocal(now: Date = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function currentMonth(now: Date): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function previousMonth(now: Date): string {
  const date = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function createExpenseId(): string {
  const random = globalThis.crypto?.randomUUID?.();
  if (random) return `expense-${random}`;
  return `expense-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Normaliza el contrato nuevo y migra el formato antiguo de finanzas. */
export function sanitizeExpenseRecords(value: unknown): ExpenseRecord[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!isRecord(item)) return null;
      const concept = toText(item['concept'] ?? item['description']);
      const date = toDate(item['date']);
      const amount = toAmount(item['amount']);
      const category = toText(item['category'], 'otros');
      if (!concept || !date || amount === 0) return null;
      return {
        id: toText(item['id']) || createExpenseId(),
        date,
        concept,
        category,
        type: isType(item['type']) ? item['type'] : 'inmediato',
        amount,
        paymentMethod: isPaymentMethod(item['paymentMethod']) ? item['paymentMethod'] : 'efectivo',
        status: isStatus(item['status']) ? item['status'] : 'pagado',
        includesVat: item['includesVat'] === true,
        irRetention: toRetention(item['irRetention']),
        beneficiary: toText(item['beneficiary'] ?? item['provider']),
        notes: toText(item['notes'] ?? item['observations']),
        scheduledFor: toDate(item['scheduledFor']),
        recurrence: toText(item['recurrence']),
        createdAt: toText(item['createdAt']) || `${date}T12:00:00.000Z`,
      } satisfies ExpenseRecord;
    })
    .filter((item): item is ExpenseRecord => item !== null)
    .slice(0, EXPENSES_MAX_RECORDS);
}

export function createExpenseRecord(
  payload: CreateExpensePayload,
  now: Date = new Date(),
): ExpenseRecord | null {
  const concept = toText(payload.concept);
  const category = toText(payload.category);
  const amount = toAmount(payload.amount);
  const date = toDate(payload.date) || todayLocal(now);
  if (!concept || !category || amount === 0 || !isType(payload.type)) return null;
  return {
    id: createExpenseId(),
    date,
    concept,
    category,
    type: payload.type,
    amount,
    paymentMethod: isPaymentMethod(payload.paymentMethod) ? payload.paymentMethod : 'efectivo',
    status: payload.type === 'inmediato' ? 'pagado' : 'pendiente',
    includesVat: payload.includesVat === true,
    irRetention: toRetention(payload.irRetention),
    beneficiary: toText(payload.beneficiary),
    notes: toText(payload.notes),
    scheduledFor: toDate(payload.scheduledFor),
    recurrence: toText(payload.recurrence),
    createdAt: now.toISOString(),
  };
}

export function updateExpenseRecord(
  current: ExpenseRecord,
  payload: CreateExpensePayload,
): ExpenseRecord | null {
  const concept = toText(payload.concept);
  const category = toText(payload.category);
  const amount = toAmount(payload.amount);
  const date = toDate(payload.date) || current.date;
  if (!concept || !category || amount === 0 || !isType(payload.type)) return null;
  return {
    ...current,
    date,
    concept,
    category,
    type: payload.type,
    amount,
    paymentMethod: isPaymentMethod(payload.paymentMethod) ? payload.paymentMethod : 'efectivo',
    includesVat: payload.includesVat === true,
    irRetention: toRetention(payload.irRetention),
    beneficiary: toText(payload.beneficiary),
    notes: toText(payload.notes),
    scheduledFor: toDate(payload.scheduledFor),
    recurrence: toText(payload.recurrence),
  };
}

function matchesPeriod(date: string, period: ExpenseFilters['period'], now: Date): boolean {
  if (period === 'all') return true;
  if (period === 'year') return date.startsWith(String(now.getFullYear()));
  if (period === 'previous') return date.startsWith(previousMonth(now));
  return date.startsWith(currentMonth(now));
}

function matchesType(record: ExpenseRecord, type: ExpenseFilters['type']): boolean {
  if (type === 'all') return true;
  if (type === 'programado') return record.type !== 'inmediato';
  return record.type === type;
}

function normalizeSearch(value: string): string {
  return value.trim().toLowerCase();
}

export function filterExpenses(
  records: readonly ExpenseRecord[],
  filters: ExpenseFilters,
  now: Date = new Date(),
): ExpenseRecord[] {
  const search = normalizeSearch(filters.search);
  return records
    .filter((record) => {
      if (!matchesPeriod(record.date, filters.period, now)) return false;
      if (filters.status === 'active' && record.status === 'cancelado') return false;
      if (filters.status === 'cancelled' && record.status !== 'cancelado') return false;
      if (!matchesType(record, filters.type)) return false;
      if (filters.category !== 'all' && record.category !== filters.category) return false;
      if (filters.paymentMethod !== 'all' && record.paymentMethod !== filters.paymentMethod) {
        return false;
      }
      if (
        filters.beneficiary &&
        !normalizeSearch(record.beneficiary).includes(normalizeSearch(filters.beneficiary))
      ) {
        return false;
      }
      if (search) {
        const haystack = `${record.concept} ${record.category} ${record.beneficiary}`.toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      return true;
    })
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
}

export function computeExpensesSummary(
  records: readonly ExpenseRecord[],
  now: Date = new Date(),
): ExpensesSummary {
  const today = todayLocal(now);
  const month = currentMonth(now);
  const year = String(now.getFullYear());
  let day = 0;
  let monthTotal = 0;
  let yearTotal = 0;
  let pending = 0;
  let recurringActive = 0;
  let salariesPending = 0;

  for (const record of records) {
    if (record.status === 'cancelado') continue;
    if (record.date === today) day += record.amount;
    if (record.date.startsWith(month)) monthTotal += record.amount;
    if (record.date.startsWith(year)) yearTotal += record.amount;
    if (record.status === 'pendiente') {
      pending += record.amount;
      if (record.category === 'salarios') salariesPending += record.amount;
    }
    if (record.type === 'recurrente') recurringActive += 1;
  }

  const round = (value: number) => Math.round(value * 100) / 100;
  return {
    day: round(day),
    month: round(monthTotal),
    year: round(yearTotal),
    pending: round(pending),
    recurringActive,
    salariesPending: round(salariesPending),
  };
}

export { todayLocal as expenseToday };
