import type { CashMovement, CashMovementFilters } from '../../../models/finance.model';

export const CASH_NOW = new Date('2026-10-29T12:00:00');

export function cashMovement(overrides: Partial<CashMovement> = {}): CashMovement {
  return {
    id: 'cash-1',
    date: '2026-10-20',
    createdAt: '2026-10-20T10:00:00.000Z',
    type: 'ingreso',
    concept: 'Cobro',
    amount: 100,
    currency: 'NIO',
    originalAmount: 100,
    exchangeRate: 1,
    paymentMethod: 'efectivo',
    category: 'aporte',
    source: 'manual',
    status: 'completado',
    reference: '',
    observations: '',
    ...overrides,
  };
}

export function cashFilters(overrides: Partial<CashMovementFilters> = {}): CashMovementFilters {
  return {
    period: 'año',
    search: '',
    flow: 'todos',
    origin: 'todos',
    status: 'completados',
    paymentMethod: 'todas',
    category: 'todas',
    customFrom: '',
    customTo: '',
    page: 1,
    ...overrides,
  };
}
