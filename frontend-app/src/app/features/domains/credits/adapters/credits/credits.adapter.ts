import { CREDITS_MAX_RECORDS } from '../../constants/credits.constants';
import type { CreateCreditPayload, CreditRecord, CreditsSummary } from '../../models/credit.model';

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

function toBalance(value: unknown): number {
  const parsed = typeof value === 'string' ? Number(value.replace(',', '.')) : value;
  if (typeof parsed !== 'number' || !Number.isFinite(parsed) || parsed < 0) return -1;
  return Math.round(parsed * 100) / 100;
}

export function todayDate(now: Date = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

export function isCreditOverdue(
  record: Pick<CreditRecord, 'balance' | 'dueDate'>,
  today: string,
): boolean {
  return record.balance > 0 && record.dueDate < today;
}

export function isCreditPaid(record: Pick<CreditRecord, 'balance'>): boolean {
  return record.balance <= 0;
}

/** Normaliza créditos persistidos y descarta registros inválidos. */
export function sanitizeCreditRecords(value: unknown): CreditRecord[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!isRecord(item)) return null;
      const id = toText(item['id']);
      const customer = toText(item['customer']);
      const concept = toText(item['concept']);
      const date = toDate(item['date']);
      const dueDate = toDate(item['dueDate']);
      const amount = toAmount(item['amount']);
      const balance = toBalance(item['balance']);
      if (!id || !customer || !concept || !date || !dueDate || amount === 0 || balance < 0) {
        return null;
      }
      return {
        id,
        customer,
        concept,
        date,
        dueDate,
        amount,
        balance: Math.min(balance, amount),
      } satisfies CreditRecord;
    })
    .filter((item): item is CreditRecord => item !== null)
    .slice(0, CREDITS_MAX_RECORDS);
}

export function createCreditId(): string {
  const random = globalThis.crypto?.randomUUID?.();
  if (random) return `credit-${random}`;
  return `credit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createCreditRecord(
  payload: CreateCreditPayload,
  now: Date = new Date(),
): CreditRecord | null {
  const customer = toText(payload.customer);
  const concept = toText(payload.concept);
  const dueDate = toDate(payload.dueDate);
  const amount = toAmount(payload.amount);
  if (!customer || !concept || !dueDate || amount === 0) return null;
  return {
    id: createCreditId(),
    customer,
    concept,
    date: todayDate(now),
    dueDate,
    amount,
    balance: amount,
  };
}

/** Totales de créditos: pendiente, vencido y cobrado. */
export function computeCreditsSummary(
  records: readonly CreditRecord[],
  today: string = todayDate(),
): CreditsSummary {
  let outstandingTotal = 0;
  let overdueTotal = 0;
  let collectedTotal = 0;
  let activeCount = 0;
  for (const record of records) {
    collectedTotal += record.amount - record.balance;
    if (record.balance <= 0) continue;
    outstandingTotal += record.balance;
    activeCount += 1;
    if (isCreditOverdue(record, today)) overdueTotal += record.balance;
  }
  return {
    outstandingTotal: Math.round(outstandingTotal * 100) / 100,
    overdueTotal: Math.round(overdueTotal * 100) / 100,
    collectedTotal: Math.round(collectedTotal * 100) / 100,
    activeCount,
  };
}
