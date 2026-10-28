import {
  computePayablesSummary,
  createPayableRecord,
  isPayableOverdue,
  sanitizePayableRecords,
  todayDate,
} from './payables.adapter';
import type { PayableRecord } from '../../models/payables.model';

const PAYABLE: PayableRecord = {
  id: 'payable-1',
  supplier: 'Distribuidora Central',
  concept: 'Factura 001',
  dueDate: '2026-10-20',
  amount: 500,
  status: 'pendiente',
  paidAt: '',
};

describe('payables.adapter', () => {
  it('debe normalizar cuentas válidas y descartar inválidas', () => {
    const records = sanitizePayableRecords([
      PAYABLE,
      { ...PAYABLE, id: '' },
      { ...PAYABLE, amount: 0 },
      { ...PAYABLE, dueDate: '20/10/2026' },
      { ...PAYABLE, status: 'otra' },
      'no-es-registro',
    ]);

    expect(records).toEqual([PAYABLE]);
  });

  it('debe tolerar entradas que no son listas y respetar el límite', () => {
    expect(sanitizePayableRecords(null)).toEqual([]);
    expect(sanitizePayableRecords({})).toEqual([]);

    const records = Array.from({ length: 505 }, (_, index) => ({
      ...PAYABLE,
      id: `payable-${index}`,
    }));
    expect(sanitizePayableRecords(records)).toHaveLength(500);
  });

  it('debe crear cuentas válidas y rechazar payloads incompletos', () => {
    expect(
      createPayableRecord({
        supplier: '  Proveedor  ',
        concept: '  Factura  ',
        dueDate: '2026-11-01',
        amount: 250,
      }),
    ).toMatchObject({
      supplier: 'Proveedor',
      concept: 'Factura',
      dueDate: '2026-11-01',
      amount: 250,
      status: 'pendiente',
      paidAt: '',
    });
    expect(
      createPayableRecord({
        supplier: '',
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
        createPayableRecord({
          supplier: 'Proveedor',
          concept: 'Factura',
          dueDate: '2026-11-01',
          amount: 10,
        })?.id,
      ).toMatch(/^payable-/);
    } finally {
      vi.stubGlobal('crypto', original);
    }
  });

  it('debe calcular pendientes, vencidas y pagadas', () => {
    const today = '2026-10-27';
    const summary = computePayablesSummary(
      [
        { ...PAYABLE, amount: 100 },
        { ...PAYABLE, id: 'payable-2', dueDate: '2026-10-30', amount: 200 },
        { ...PAYABLE, id: 'payable-3', status: 'pagada', paidAt: '2026-10-25', amount: 300 },
      ],
      today,
    );

    expect(summary).toEqual({
      pendingTotal: 300,
      overdueTotal: 100,
      paidTotal: 300,
      pendingCount: 2,
    });
  });

  it('debe considerar vencida solo una cuenta pendiente con fecha anterior', () => {
    expect(isPayableOverdue({ dueDate: '2026-10-20', status: 'pendiente' }, '2026-10-27')).toBe(
      true,
    );
    expect(isPayableOverdue({ dueDate: '2026-10-30', status: 'pendiente' }, '2026-10-27')).toBe(
      false,
    );
    expect(isPayableOverdue({ dueDate: '2026-10-20', status: 'pagada' }, '2026-10-27')).toBe(false);
  });

  it('debe devolver la fecha local de hoy en formato ISO corto', () => {
    expect(todayDate(new Date(2026, 9, 28))).toBe('2026-10-28');
  });
});
