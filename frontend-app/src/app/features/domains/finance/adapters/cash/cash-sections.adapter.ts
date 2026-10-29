import {
  CASH_MAX_RECORDS,
  CASH_PAYMENT_METHOD_KINDS,
  CASH_PETTY_MAX_RECORDS,
  DEFAULT_CASH_PAYMENT_METHODS,
} from '../../constants/finance.constants';
import type {
  CashClosure,
  CashClosurePreview,
  CashPaymentMethod,
  CashPaymentMethodSummary,
  CashTransfer,
  CashTransferAccountKind,
  CashTransferSummary,
  CreateCashClosurePayload,
  CreateCashPaymentMethodPayload,
  CreateCashTransferPayload,
  CreatePettyCashMovementPayload,
  PettyCashFund,
  PettyCashMovement,
  PettyCashMovementType,
  PettyCashSummary,
  CashMovement,
} from '../../models/finance.model';
import { cashToday, createCashMovementId, toCashDate } from './cash-movements.adapter';

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function toText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function toNumber(value: unknown): number {
  const parsed = typeof value === 'string' ? Number(value.replace(',', '.')) : value;
  return typeof parsed === 'number' && Number.isFinite(parsed) ? parsed : 0;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function toNonNegative(value: unknown): number {
  const amount = toNumber(value);
  return Number.isFinite(amount) && amount >= 0 ? round(amount) : 0;
}

function isPositive(value: unknown): number {
  const amount = toNumber(value);
  return Number.isFinite(amount) && amount > 0 ? round(amount) : 0;
}

function adaptList<T>(
  value: unknown,
  adapt: (item: Record<string, unknown>) => T | null,
  max: number,
): T[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (isRecord(item) ? adapt(item) : null))
    .filter((item): item is T => item !== null)
    .slice(0, max);
}

/* -------------------------------------------------------------------------- */
/* Métodos de pago                                                            */
/* -------------------------------------------------------------------------- */

export function cashPaymentMethodIcon(kind: string): string {
  return CASH_PAYMENT_METHOD_KINDS.find((item) => item.value === kind)?.icon ?? 'fa-solid fa-coins';
}

/** Métodos iniciales para una empresa sin configuración previa. */
export function seedCashPaymentMethods(now: Date = new Date()): CashPaymentMethod[] {
  const createdAt = now.toISOString();
  return DEFAULT_CASH_PAYMENT_METHODS.map((method) => ({ ...method, createdAt }));
}

function adaptCashPaymentMethod(raw: Record<string, unknown>): CashPaymentMethod | null {
  const id = toText(raw['id']);
  const name = toText(raw['name']);
  if (!id || !name) return null;
  const kind = toText(raw['kind']) || 'otro';
  return {
    id,
    name,
    kind,
    icon: toText(raw['icon']) || cashPaymentMethodIcon(kind),
    active: raw['active'] !== false,
    createdAt: toText(raw['createdAt']) || new Date().toISOString(),
  };
}

export function sanitizeCashPaymentMethods(value: unknown): CashPaymentMethod[] {
  return adaptList(value, adaptCashPaymentMethod, CASH_MAX_RECORDS);
}

export function createCashPaymentMethod(
  payload: CreateCashPaymentMethodPayload,
  now: Date = new Date(),
): CashPaymentMethod | null {
  const name = toText(payload.name);
  if (!name) return null;
  const kind = toText(payload.kind) || 'otro';
  return {
    id: createCashMovementId('method'),
    name,
    kind,
    icon: toText(payload.icon) || cashPaymentMethodIcon(kind),
    active: true,
    createdAt: now.toISOString(),
  };
}

export function summarizeCashPaymentMethods(
  methods: readonly CashPaymentMethod[],
  movements: readonly CashMovement[],
): CashPaymentMethodSummary[] {
  const completed = movements.filter((movement) => movement.status === 'completado');
  return methods.map((method) => {
    const own = completed.filter((movement) => movement.paymentMethod === method.id);
    let income = 0;
    let expense = 0;
    for (const movement of own) {
      if (movement.type === 'ingreso') income += movement.amount;
      else expense += movement.amount;
    }
    return {
      method,
      count: own.length,
      income: round(income),
      expense: round(expense),
      balance: round(income - expense),
    };
  });
}

/* -------------------------------------------------------------------------- */
/* Cierres diarios                                                            */
/* -------------------------------------------------------------------------- */

function adaptCashClosure(raw: Record<string, unknown>): CashClosure | null {
  const id = toText(raw['id']);
  const date = toCashDate(raw['date']);
  if (!id || !date) return null;
  return {
    id,
    date,
    openingBalance: toNonNegative(raw['openingBalance']),
    income: toNonNegative(raw['income']),
    expense: toNonNegative(raw['expense']),
    expectedBalance: toNonNegative(raw['expectedBalance']),
    countedBalance: toNonNegative(raw['countedBalance']),
    difference: round(toNumber(raw['difference'])),
    movementsCount: Math.max(0, Math.trunc(toNumber(raw['movementsCount']))),
    notes: toText(raw['notes']),
    closedAt: toText(raw['closedAt']) || new Date().toISOString(),
  };
}

export function sanitizeCashClosures(value: unknown): CashClosure[] {
  return adaptList(value, adaptCashClosure, CASH_MAX_RECORDS).sort((a, b) =>
    b.date.localeCompare(a.date),
  );
}

/**
 * Calcula el corte del día: saldo de apertura (todo lo anterior), ingresos y
 * egresos del día y el esperado en caja.
 */
export function buildCashClosurePreview(
  movements: readonly CashMovement[],
  date: string,
  existing: CashClosure | null = null,
  today: string = cashToday(),
): CashClosurePreview {
  const target = toCashDate(date) || today;
  const completed = movements.filter((movement) => movement.status === 'completado');
  let openingBalance = 0;
  let income = 0;
  let expense = 0;
  let movementsCount = 0;

  for (const movement of completed) {
    if (movement.date < target) {
      openingBalance += movement.type === 'ingreso' ? movement.amount : -movement.amount;
    } else if (movement.date === target) {
      movementsCount += 1;
      if (movement.type === 'ingreso') income += movement.amount;
      else expense += movement.amount;
    }
  }

  return {
    date: target,
    openingBalance: round(openingBalance),
    income: round(income),
    expense: round(expense),
    expectedBalance: round(openingBalance + income - expense),
    movementsCount,
    existing,
  };
}

export function createCashClosure(
  preview: CashClosurePreview,
  payload: CreateCashClosurePayload,
  now: Date = new Date(),
): CashClosure | null {
  const countedBalance = toNonNegative(payload.countedBalance);
  if (!Number.isFinite(payload.countedBalance) || payload.countedBalance < 0) return null;
  if (preview.existing) return null;
  return {
    id: createCashMovementId('closure'),
    date: preview.date,
    openingBalance: preview.openingBalance,
    income: preview.income,
    expense: preview.expense,
    expectedBalance: preview.expectedBalance,
    countedBalance,
    difference: round(countedBalance - preview.expectedBalance),
    movementsCount: preview.movementsCount,
    notes: toText(payload.notes),
    closedAt: now.toISOString(),
  };
}

/* -------------------------------------------------------------------------- */
/* Caja chica                                                                 */
/* -------------------------------------------------------------------------- */

export function emptyPettyCashFund(now: Date = new Date()): PettyCashFund {
  return { amount: 0, responsible: '', updatedAt: now.toISOString() };
}

export function sanitizePettyCashFund(value: unknown): PettyCashFund | null {
  if (!isRecord(value)) return null;
  return {
    amount: toNonNegative(value['amount']),
    responsible: toText(value['responsible']),
    updatedAt: toText(value['updatedAt']) || new Date().toISOString(),
  };
}

export function createPettyCashFund(
  amount: number,
  responsible: string,
  now: Date = new Date(),
): PettyCashFund | null {
  if (!Number.isFinite(amount) || amount < 0) return null;
  return {
    amount: round(amount),
    responsible: responsible.trim(),
    updatedAt: now.toISOString(),
  };
}

function adaptPettyCashMovement(raw: Record<string, unknown>): PettyCashMovement | null {
  const id = toText(raw['id']);
  const date = toCashDate(raw['date']);
  const concept = toText(raw['concept']);
  const type = raw['type'];
  const amount = isPositive(raw['amount']);
  if (!id || !date || !concept || amount === 0) return null;
  if (type !== 'reposicion' && type !== 'gasto') return null;
  return {
    id,
    date,
    type,
    concept,
    amount,
    createdAt: toText(raw['createdAt']) || `${date}T12:00:00.000Z`,
  };
}

export function sanitizePettyCashMovements(value: unknown): PettyCashMovement[] {
  return adaptList(value, adaptPettyCashMovement, CASH_PETTY_MAX_RECORDS).sort((a, b) =>
    `${b.date}${b.createdAt}`.localeCompare(`${a.date}${a.createdAt}`),
  );
}

export function createPettyCashMovement(
  payload: CreatePettyCashMovementPayload,
  now: Date = new Date(),
): PettyCashMovement | null {
  const date = toCashDate(payload.date);
  const concept = toText(payload.concept);
  const amount = isPositive(payload.amount);
  const type: PettyCashMovementType = payload.type;
  if (!date || !concept || amount === 0) return null;
  if (type !== 'reposicion' && type !== 'gasto') return null;
  return {
    id: createCashMovementId('petty'),
    date,
    type,
    concept,
    amount,
    createdAt: now.toISOString(),
  };
}

export function computePettyCashSummary(
  fund: PettyCashFund,
  movements: readonly PettyCashMovement[],
): PettyCashSummary {
  let replenishments = 0;
  let expenses = 0;
  for (const movement of movements) {
    if (movement.type === 'reposicion') replenishments += movement.amount;
    else expenses += movement.amount;
  }
  return {
    fund: round(fund.amount),
    replenishments: round(replenishments),
    expenses: round(expenses),
    balance: round(fund.amount + replenishments - expenses),
    movementsCount: movements.length,
  };
}

/* -------------------------------------------------------------------------- */
/* Transferencias                                                             */
/* -------------------------------------------------------------------------- */

function isAccountKind(value: unknown): value is CashTransferAccountKind {
  return value === 'cash' || value === 'bank';
}

function adaptCashTransfer(raw: Record<string, unknown>): CashTransfer | null {
  const id = toText(raw['id']);
  const date = toCashDate(raw['date']);
  const fromId = toText(raw['fromId']);
  const toId = toText(raw['toId']);
  const amount = isPositive(raw['amount']);
  const fromKind = raw['fromKind'];
  const toKind = raw['toKind'];
  if (!id || !date || !fromId || !toId || amount === 0) return null;
  if (!isAccountKind(fromKind) || !isAccountKind(toKind)) return null;
  return {
    id,
    date,
    fromId,
    fromLabel: toText(raw['fromLabel']) || 'Caja',
    fromKind,
    toId,
    toLabel: toText(raw['toLabel']) || 'Caja',
    toKind,
    amount,
    concept: toText(raw['concept']) || 'Transferencia interna',
    notes: toText(raw['notes']),
    status: raw['status'] === 'anulado' ? 'anulado' : 'completado',
    createdAt: toText(raw['createdAt']) || `${date}T12:00:00.000Z`,
  };
}

export function sanitizeCashTransfers(value: unknown): CashTransfer[] {
  return adaptList(value, adaptCashTransfer, CASH_MAX_RECORDS).sort((a, b) =>
    `${b.date}${b.createdAt}`.localeCompare(`${a.date}${a.createdAt}`),
  );
}

export function createCashTransfer(
  payload: CreateCashTransferPayload,
  now: Date = new Date(),
): CashTransfer | null {
  const date = toCashDate(payload.date);
  const amount = isPositive(payload.amount);
  const concept = toText(payload.concept) || 'Transferencia interna';
  if (!date || amount === 0) return null;
  if (!isAccountKind(payload.fromKind) || !isAccountKind(payload.toKind)) return null;
  if (!payload.fromId || !payload.toId || payload.fromId === payload.toId) return null;
  return {
    id: createCashMovementId('transfer'),
    date,
    fromId: payload.fromId,
    fromLabel: payload.fromLabel,
    fromKind: payload.fromKind,
    toId: payload.toId,
    toLabel: payload.toLabel,
    toKind: payload.toKind,
    amount,
    concept,
    notes: toText(payload.notes),
    status: 'completado',
    createdAt: now.toISOString(),
  };
}

/** Genera los movimientos de caja que respaldan los extremos en efectivo. */
export function buildTransferCashMovements(transfer: CashTransfer): CashMovement[] {
  const movements: CashMovement[] = [];
  const base = {
    date: transfer.date,
    createdAt: transfer.createdAt,
    amount: transfer.amount,
    currency: 'NIO' as const,
    originalAmount: transfer.amount,
    exchangeRate: 1,
    paymentMethod: 'transferencia',
    category: 'transferencia' as const,
    source: 'transferencia' as const,
    status: 'completado' as const,
    reference: '',
    observations: transfer.notes,
    transferId: transfer.id,
  };
  if (transfer.fromKind === 'cash') {
    movements.push({
      ...base,
      id: `${transfer.id}-out`,
      type: 'egreso',
      concept: `Transferencia a ${transfer.toLabel}`,
    });
  }
  if (transfer.toKind === 'cash') {
    movements.push({
      ...base,
      id: `${transfer.id}-in`,
      type: 'ingreso',
      concept: `Transferencia desde ${transfer.fromLabel}`,
    });
  }
  return movements;
}

export function computeCashTransferSummary(
  transfers: readonly CashTransfer[],
): CashTransferSummary {
  let totalTransferred = 0;
  let cancelledCount = 0;
  for (const transfer of transfers) {
    if (transfer.status === 'anulado') {
      cancelledCount += 1;
      continue;
    }
    totalTransferred += transfer.amount;
  }
  return {
    totalTransferred: round(totalTransferred),
    transfersCount: transfers.length,
    cancelledCount,
  };
}
