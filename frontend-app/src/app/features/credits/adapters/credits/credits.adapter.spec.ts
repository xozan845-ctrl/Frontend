import {
  computeCreditsSummary,
  createCreditRecord,
  isCreditOverdue,
  isCreditPaid,
  sanitizeCreditRecords,
  todayDate,
} from './credits.adapter';
import type { CreditRecord } from '../../models/credit.model';

const CREDIT: CreditRecord = {
  id: 'credit-1',
  customer: 'Carla López',
  concept: 'Pedido a crédito',
  date: '2026-10-01',
  dueDate: '2026-10-20',
  amount: 500,
  balance: 500,
};

describe('credits.adapter', () => {
  it('debe normalizar créditos válidos y descartar inválidos', () => {
    const records = sanitizeCreditRecords([
      CREDIT,
      { ...CREDIT, id: '' },
      { ...CREDIT, amount: 0 },
      { ...CREDIT, dueDate: '20/10/2026' },
      { ...CREDIT, balance: -1 },
      'no-es-credito',
    ]);

    expect(records).toEqual([CREDIT]);
  });

  it('debe limitar el saldo al importe original y tolerar entradas inválidas', () => {
    expect(sanitizeCreditRecords([{ ...CREDIT, balance: 900 }])[0].balance).toBe(500);
    expect(sanitizeCreditRecords(null)).toEqual([]);
    expect(sanitizeCreditRecords({})).toEqual([]);
    expect(
      sanitizeCreditRecords(
        Array.from({ length: 505 }, (_, index) => ({ ...CREDIT, id: `c-${index}` })),
      ),
    ).toHaveLength(500);
  });

  it('debe crear créditos válidos y rechazar payloads incompletos', () => {
    const credit = createCreditRecord(
      {
        customer: '  Carla  ',
        concept: '  Pedido  ',
        dueDate: '2026-11-01',
        amount: 250,
      },
      new Date(2026, 9, 28),
    );

    expect(credit).toMatchObject({
      customer: 'Carla',
      concept: 'Pedido',
      date: '2026-10-28',
      dueDate: '2026-11-01',
      amount: 250,
      balance: 250,
    });
    expect(
      createCreditRecord({
        customer: '',
        concept: '',
        dueDate: '',
        amount: 0,
      }),
    ).toBeNull();
  });

  it('debe generar un id alternativo sin crypto.randomUUID', () => {
    const original = globalThis.crypto;
    vi.stubGlobal('crypto', {});
    try {
      expect(
        createCreditRecord({
          customer: 'Carla',
          concept: 'Pedido',
          dueDate: '2026-11-01',
          amount: 10,
        })?.id,
      ).toMatch(/^credit-/);
    } finally {
      vi.stubGlobal('crypto', original);
    }
  });

  it('debe calcular pendientes, vencidos y cobrados', () => {
    const today = '2026-10-27';
    const summary = computeCreditsSummary(
      [
        { ...CREDIT, amount: 100, balance: 100 },
        { ...CREDIT, id: 'credit-2', dueDate: '2026-10-30', amount: 200, balance: 200 },
        { ...CREDIT, id: 'credit-3', amount: 300, balance: 0 },
      ],
      today,
    );

    expect(summary).toEqual({
      outstandingTotal: 300,
      overdueTotal: 100,
      collectedTotal: 300,
      activeCount: 2,
    });
  });

  it('debe detectar vencidos, pagados y la fecha de hoy', () => {
    expect(isCreditOverdue({ dueDate: '2026-10-20', balance: 10 }, '2026-10-27')).toBe(true);
    expect(isCreditOverdue({ dueDate: '2026-10-30', balance: 10 }, '2026-10-27')).toBe(false);
    expect(isCreditOverdue({ dueDate: '2026-10-20', balance: 0 }, '2026-10-27')).toBe(false);
    expect(isCreditPaid({ balance: 0 })).toBe(true);
    expect(todayDate(new Date(2026, 9, 28))).toBe('2026-10-28');
  });
});
