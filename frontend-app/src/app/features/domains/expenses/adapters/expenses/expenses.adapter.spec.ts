import {
  computeExpensesSummary,
  createExpenseRecord,
  filterExpenses,
  sanitizeExpenseRecords,
  updateExpenseRecord,
} from './expenses.adapter';
import type { ExpenseRecord } from '../../models/expense.model';

function localDate(daysFromToday = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

const RECORD: ExpenseRecord = {
  id: 'expense-1',
  date: localDate(),
  concept: 'Publicidad',
  category: 'publicidad',
  type: 'inmediato',
  amount: 100,
  paymentMethod: 'efectivo',
  status: 'pagado',
  includesVat: false,
  irRetention: 0,
  beneficiary: 'Ana',
  notes: '',
  scheduledFor: '',
  recurrence: '',
  createdAt: '2026-10-29T12:00:00.000Z',
};

describe('expenses.adapter', () => {
  it('debe normalizar gastos nuevos y migrar el formato anterior', () => {
    const records = sanitizeExpenseRecords([
      RECORD,
      {
        id: 'legacy-1',
        date: '2026-10-01',
        category: 'servicios',
        description: 'Luz',
        amount: 50,
        paymentMethod: 'transferencia',
      },
      { id: '', date: '', concept: '', amount: 0 },
      'no-es-gasto',
    ]);

    expect(records).toHaveLength(2);
    expect(records[0]).toEqual(RECORD);
    expect(records[1]).toMatchObject({
      concept: 'Luz',
      type: 'inmediato',
      status: 'pagado',
      category: 'servicios',
    });
  });

  it('debe crear gastos inmediatos pagados y programados pendientes', () => {
    const immediate = createExpenseRecord(
      {
        date: localDate(),
        concept: '  Publicidad  ',
        category: 'publicidad',
        type: 'inmediato',
        amount: 100,
        paymentMethod: 'efectivo',
        includesVat: true,
        irRetention: 10,
        beneficiary: '  Ana  ',
        notes: '  Nota  ',
        scheduledFor: '',
        recurrence: '',
      },
      new Date(2026, 9, 29),
    );
    const scheduled = createExpenseRecord({
      date: localDate(),
      concept: 'Renta',
      category: 'renta',
      type: 'programado',
      amount: 500,
      paymentMethod: 'transferencia',
      includesVat: false,
      irRetention: 0,
      beneficiary: '',
      notes: '',
      scheduledFor: localDate(10),
      recurrence: '',
    });

    expect(immediate).toMatchObject({
      concept: 'Publicidad',
      beneficiary: 'Ana',
      notes: 'Nota',
      status: 'pagado',
    });
    expect(scheduled?.status).toBe('pendiente');
    expect(
      createExpenseRecord({
        date: localDate(),
        concept: '',
        category: '',
        type: 'inmediato',
        amount: 0,
        paymentMethod: 'efectivo',
        includesVat: false,
        irRetention: 0,
        beneficiary: '',
        notes: '',
        scheduledFor: '',
        recurrence: '',
      }),
    ).toBeNull();
  });

  it('debe actualizar un gasto conservando id y estado', () => {
    const updated = updateExpenseRecord(RECORD, {
      date: localDate(),
      concept: 'Publicidad actualizada',
      category: 'publicidad',
      type: 'programado',
      amount: 200,
      paymentMethod: 'tarjeta',
      includesVat: true,
      irRetention: 0,
      beneficiary: 'Luis',
      notes: '',
      scheduledFor: localDate(3),
      recurrence: '',
    });

    expect(updated).toMatchObject({
      id: 'expense-1',
      status: 'pagado',
      concept: 'Publicidad actualizada',
      type: 'programado',
      amount: 200,
    });
  });

  it('debe generar id alternativo sin crypto.randomUUID', () => {
    const original = globalThis.crypto;
    vi.stubGlobal('crypto', {});
    try {
      const record = createExpenseRecord({
        date: localDate(),
        concept: 'Gasto',
        category: 'otros',
        type: 'inmediato',
        amount: 1,
        paymentMethod: 'efectivo',
        includesVat: false,
        irRetention: 0,
        beneficiary: '',
        notes: '',
        scheduledFor: '',
        recurrence: '',
      });
      expect(record?.id).toMatch(/^expense-/);
    } finally {
      vi.stubGlobal('crypto', original);
    }
  });

  it('debe filtrar por período, estado, tipo, categoría, pago, beneficiario y búsqueda', () => {
    const now = new Date(2026, 9, 29);
    const records: ExpenseRecord[] = [
      { ...RECORD, id: 'a', date: '2026-10-29', amount: 100 },
      { ...RECORD, id: 'b', date: '2026-09-15', amount: 200, status: 'cancelado' },
      {
        ...RECORD,
        id: 'c',
        date: '2026-10-15',
        amount: 300,
        type: 'recurrente',
        beneficiary: 'Luis',
        category: 'salarios',
      },
    ];

    expect(
      filterExpenses(
        records,
        {
          period: 'month',
          status: 'active',
          type: 'all',
          category: 'all',
          paymentMethod: 'all',
          beneficiary: '',
          search: '',
        },
        now,
      ).map((r) => r.id),
    ).toEqual(['a', 'c']);
    expect(
      filterExpenses(
        records,
        {
          period: 'previous',
          status: 'all',
          type: 'all',
          category: 'all',
          paymentMethod: 'all',
          beneficiary: '',
          search: '',
        },
        now,
      ).map((r) => r.id),
    ).toEqual(['b']);
    expect(
      filterExpenses(
        records,
        {
          period: 'year',
          status: 'cancelled',
          type: 'all',
          category: 'all',
          paymentMethod: 'all',
          beneficiary: '',
          search: '',
        },
        now,
      ).map((r) => r.id),
    ).toEqual(['b']);
    expect(
      filterExpenses(
        records,
        {
          period: 'month',
          status: 'all',
          type: 'programado',
          category: 'all',
          paymentMethod: 'all',
          beneficiary: '',
          search: '',
        },
        now,
      ).map((r) => r.id),
    ).toEqual(['c']);
    expect(
      filterExpenses(
        records,
        {
          period: 'all',
          status: 'all',
          type: 'all',
          category: 'salarios',
          paymentMethod: 'all',
          beneficiary: 'luis',
          search: 'luis',
        },
        now,
      ).map((r) => r.id),
    ).toEqual(['c']);
  });

  it('debe calcular KPIs excluyendo cancelados', () => {
    const now = new Date(2026, 9, 29);
    const summary = computeExpensesSummary(
      [
        { ...RECORD, id: 'today', date: '2026-10-29', amount: 100 },
        {
          ...RECORD,
          id: 'pending',
          date: '2026-10-01',
          amount: 200,
          status: 'pendiente',
          category: 'salarios',
        },
        { ...RECORD, id: 'recurring', date: '2026-10-02', amount: 50, type: 'recurrente' },
        { ...RECORD, id: 'cancelled', date: '2026-10-03', amount: 900, status: 'cancelado' },
        { ...RECORD, id: 'old', date: '2025-12-31', amount: 400 },
      ],
      now,
    );

    expect(summary).toEqual({
      day: 100,
      month: 350,
      year: 350,
      pending: 200,
      recurringActive: 1,
      salariesPending: 200,
    });
  });
});
