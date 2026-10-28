import { BANKS_MAX_RECORDS } from '../../constants/banks.constants';
import type {
  BankAccount,
  BankAccountType,
  BanksSummary,
  CreateBankAccountPayload,
} from '../../models/bank.model';

const TYPE_VALUES: readonly BankAccountType[] = ['ahorro', 'corriente', 'wallet'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function toText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/** Saldo válido (>= 0) redondeado a dos decimales. */
function toBalance(value: unknown): number {
  const parsed = typeof value === 'string' ? Number(value.replace(',', '.')) : value;
  if (typeof parsed !== 'number' || !Number.isFinite(parsed) || parsed < 0) return -1;
  return Math.round(parsed * 100) / 100;
}

function isType(value: unknown): value is BankAccountType {
  return typeof value === 'string' && TYPE_VALUES.includes(value as BankAccountType);
}

function adaptAccount(raw: Record<string, unknown>): BankAccount | null {
  const id = toText(raw['id']);
  const bank = toText(raw['bank']);
  const alias = toText(raw['alias']);
  const accountNumber = toText(raw['accountNumber']);
  const type = raw['type'];
  const balance = toBalance(raw['balance']);
  if (!id || !bank || !alias || !accountNumber || !isType(type) || balance < 0) return null;
  return { id, bank, alias, accountNumber, type, balance };
}

/** Normaliza cuentas bancarias persistidas y descarta registros inválidos. */
export function sanitizeBankAccounts(value: unknown): BankAccount[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (isRecord(item) ? adaptAccount(item) : null))
    .filter((item): item is BankAccount => item !== null)
    .slice(0, BANKS_MAX_RECORDS);
}

export function createBankId(): string {
  const random = globalThis.crypto?.randomUUID?.();
  if (random) return `bank-${random}`;
  return `bank-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizePayload(payload: CreateBankAccountPayload): Omit<BankAccount, 'id'> | null {
  const bank = toText(payload.bank);
  const alias = toText(payload.alias);
  const accountNumber = toText(payload.accountNumber);
  const balance = toBalance(payload.balance);
  if (!bank || !alias || !accountNumber || !isType(payload.type) || balance < 0) return null;
  return { bank, alias, accountNumber, balance, type: payload.type };
}

export function createBankAccount(payload: CreateBankAccountPayload): BankAccount | null {
  const normalized = normalizePayload(payload);
  return normalized ? { id: createBankId(), ...normalized } : null;
}

export function updateBankAccount(
  account: BankAccount,
  payload: CreateBankAccountPayload,
): BankAccount | null {
  const normalized = normalizePayload(payload);
  return normalized ? { id: account.id, ...normalized } : null;
}

/** Saldo total y número de cuentas del ámbito activo. */
export function computeBanksSummary(accounts: readonly BankAccount[]): BanksSummary {
  const total = accounts.reduce((sum, account) => sum + account.balance, 0);
  return {
    totalBalance: Math.round(total * 100) / 100,
    accountsCount: accounts.length,
  };
}
