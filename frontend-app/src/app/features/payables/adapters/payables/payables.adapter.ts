import { PAYABLES_MAX_RECORDS } from '../../constants/payables.constants';
import type {
  CreatePayablePayload,
  PayableRecord,
  PayablesSummary,
} from '../../models/payables.model';

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function toText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
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

/** Normaliza cuentas por pagar persistidas y descarta registros inválidos. */
export function sanitizePayableRecords(value: unknown): PayableRecord[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!isRecord(item)) return null;
      const id = toText(item['id']);
      const supplier = toText(item['supplier']);
      const concept = toText(item['concept']);
      const dueDate = toDate(item['dueDate']);
      const amount = toAmount(item['amount']);
      const status = item['status'];
      if (
        !id ||
        !supplier ||
        !concept ||
        !dueDate ||
        amount === 0 ||
        (status !== 'pendiente' && status !== 'pagada')
      ) {
        return null;
      }
      return {
        id,
        supplier,
        concept,
        dueDate,
        amount,
        status,
        paidAt: toDate(item['paidAt']),
      } satisfies PayableRecord;
    })
    .filter((item): item is PayableRecord => item !== null)
    .slice(0, PAYABLES_MAX_RECORDS);
}

export function createPayableId(): string {
  const random = globalThis.crypto?.randomUUID?.();
  if (random) return `payable-${random}`;
  return `payable-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createPayableRecord(payload: CreatePayablePayload): PayableRecord | null {
  const supplier = toText(payload.supplier);
  const concept = toText(payload.concept);
  const dueDate = toDate(payload.dueDate);
  const amount = toAmount(payload.amount);
  if (!supplier || !concept || !dueDate || amount === 0) return null;
  return {
    id: createPayableId(),
    supplier,
    concept,
    dueDate,
    amount,
    status: 'pendiente',
    paidAt: '',
  };
}

/** Vencida cuando sigue pendiente y su fecha es anterior a hoy. */
export function isPayableOverdue(
  record: Pick<PayableRecord, 'dueDate' | 'status'>,
  today: string,
): boolean {
  return record.status === 'pendiente' && record.dueDate < today;
}

export function todayDate(now: Date = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

/** Totales de cuentas por pagar; las vencidas siguen pendientes. */
export function computePayablesSummary(
  records: readonly PayableRecord[],
  today: string = todayDate(),
): PayablesSummary {
  let pendingTotal = 0;
  let overdueTotal = 0;
  let paidTotal = 0;
  let pendingCount = 0;
  for (const record of records) {
    if (record.status === 'pagada') {
      paidTotal += record.amount;
      continue;
    }
    pendingTotal += record.amount;
    pendingCount += 1;
    if (isPayableOverdue(record, today)) overdueTotal += record.amount;
  }
  return {
    pendingTotal: Math.round(pendingTotal * 100) / 100,
    overdueTotal: Math.round(overdueTotal * 100) / 100,
    paidTotal: Math.round(paidTotal * 100) / 100,
    pendingCount,
  };
}
