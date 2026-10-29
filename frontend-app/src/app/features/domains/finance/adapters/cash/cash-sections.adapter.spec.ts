import {
  buildCashClosurePreview,
  buildTransferCashMovements,
  cashPaymentMethodIcon,
  computeCashTransferSummary,
  computePettyCashSummary,
  createCashClosure,
  createCashPaymentMethod,
  createCashTransfer,
  createPettyCashMovement,
  createPettyCashFund,
  emptyPettyCashFund,
  sanitizeCashClosures,
  sanitizeCashPaymentMethods,
  sanitizeCashTransfers,
  sanitizePettyCashFund,
  sanitizePettyCashMovements,
  seedCashPaymentMethods,
  summarizeCashPaymentMethods,
} from './cash-sections.adapter';
import type { CashPaymentMethod, PettyCashMovement } from '../../models/finance.model';
import { CASH_NOW as NOW, cashMovement as movement } from './fixtures/cash.fixture';

describe('cash-sections.adapter', () => {
  it('debe resumir métodos de pago y sembrar los iniciales', () => {
    const methods: CashPaymentMethod[] = seedCashPaymentMethods(NOW);
    const summaries = summarizeCashPaymentMethods(methods, [
      movement({ id: 'a', paymentMethod: 'efectivo', amount: 100 }),
      movement({ id: 'b', paymentMethod: 'efectivo', type: 'egreso', amount: 40 }),
    ]);

    expect(methods).toHaveLength(5);
    expect(summaries.find((item) => item.method.id === 'efectivo')).toMatchObject({
      count: 2,
      income: 100,
      expense: 40,
      balance: 60,
    });
  });

  it('debe construir el corte del día y guardarlo con la diferencia', () => {
    const preview = buildCashClosurePreview(
      [
        movement({ id: 'prev', amount: 300, date: '2026-10-28' }),
        movement({ id: 'in', amount: 200, date: '2026-10-29' }),
        movement({ id: 'out', type: 'egreso', amount: 50, date: '2026-10-29' }),
      ],
      '2026-10-29',
      null,
      '2026-10-29',
    );

    expect(preview).toMatchObject({
      openingBalance: 300,
      income: 200,
      expense: 50,
      expectedBalance: 450,
      movementsCount: 2,
    });

    const closure = createCashClosure(
      preview,
      { date: '2026-10-29', countedBalance: 440, notes: 'Faltó cambio' },
      NOW,
    );
    expect(closure).toMatchObject({
      countedBalance: 440,
      difference: -10,
      notes: 'Faltó cambio',
    });
    expect(sanitizeCashClosures([closure])).toEqual([closure]);
  });

  it('debe calcular caja chica y validar sus movimientos', () => {
    const fund = createPettyCashFund(1000, 'Karla', NOW)!;
    const movements: PettyCashMovement[] = [
      createPettyCashMovement(
        { date: '2026-10-20', type: 'gasto', concept: 'Café', amount: 100 },
        NOW,
      )!,
      createPettyCashMovement(
        { date: '2026-10-21', type: 'reposicion', concept: 'Reposición', amount: 200 },
        NOW,
      )!,
    ];

    expect(computePettyCashSummary(fund, movements)).toMatchObject({
      fund: 1000,
      replenishments: 200,
      expenses: 100,
      balance: 1100,
      movementsCount: 2,
    });
    expect(sanitizePettyCashMovements(movements)).toHaveLength(2);
    expect(
      createPettyCashMovement({ date: '', type: 'gasto', concept: '', amount: 0 }, NOW),
    ).toBeNull();
  });

  it('debe crear transferencias y sus movimientos de caja', () => {
    const transfer = createCashTransfer(
      {
        date: '2026-10-29',
        fromId: 'cash',
        fromLabel: 'Caja',
        fromKind: 'cash',
        toId: 'bank-1',
        toLabel: 'BAC · Operativa',
        toKind: 'bank',
        amount: 500,
        concept: 'Depósito',
      },
      NOW,
    )!;

    const movements = buildTransferCashMovements(transfer);
    expect(movements).toHaveLength(1);
    expect(movements[0]).toMatchObject({ type: 'egreso', transferId: transfer.id });
    expect(computeCashTransferSummary([transfer])).toEqual({
      totalTransferred: 500,
      transfersCount: 1,
      cancelledCount: 0,
    });
  });
});

describe('ramas de secciones', () => {
  it('debe sanear métodos, fondos y movimientos inválidos', () => {
    expect(cashPaymentMethodIcon('desconocido')).toContain('coins');
    expect(
      sanitizeCashPaymentMethods([
        { id: '', name: 'X' },
        { id: 'a', name: '' },
      ]),
    ).toEqual([]);

    const [method] = sanitizeCashPaymentMethods([
      { id: 'custom', name: 'Cheque', kind: '', active: false },
    ]);
    expect(method).toMatchObject({
      id: 'custom',
      name: 'Cheque',
      kind: 'otro',
      icon: 'fa-solid fa-coins',
      active: false,
    });

    expect(createCashPaymentMethod({ name: '', kind: 'otro' })).toBeNull();
    expect(createCashPaymentMethod({ name: 'Cheque', kind: 'cheque' })).toMatchObject({
      name: 'Cheque',
      kind: 'cheque',
      active: true,
    });

    expect(emptyPettyCashFund(NOW)).toMatchObject({ amount: 0, responsible: '' });
    expect(sanitizePettyCashFund(null)).toBeNull();
    expect(sanitizePettyCashFund({ amount: -2 })).toMatchObject({ amount: 0 });
    expect(createPettyCashFund(-1, '')).toBeNull();
    expect(createPettyCashFund(10, ' Karla ')).toMatchObject({ amount: 10, responsible: 'Karla' });
  });

  it('debe sanear cierres y movimientos de caja chica inválidos', () => {
    expect(sanitizeCashClosures([null, {}, { id: 'a', date: '20/10/2026' }])).toEqual([]);
    expect(
      sanitizeCashClosures([
        {
          id: 'closure',
          date: '2026-10-20',
          openingBalance: -5,
          income: 0,
          expense: 0,
          expectedBalance: 0,
          countedBalance: 0,
          difference: 'x',
          movementsCount: 1.9,
        },
      ])[0],
    ).toMatchObject({
      openingBalance: 0,
      difference: 0,
      movementsCount: 1,
      closedAt: expect.any(String),
    });

    expect(
      sanitizePettyCashMovements([
        { id: 'a', date: '2026-10-20', type: 'otro', concept: 'X', amount: 1 },
        { id: 'b', date: '20/10/2026', type: 'gasto', concept: 'X', amount: 1 },
        { id: 'c', date: '2026-10-20', type: 'gasto', concept: '', amount: 1 },
        { id: 'd', date: '2026-10-20', type: 'gasto', concept: 'X', amount: 0 },
      ]),
    ).toEqual([]);
    expect(
      createPettyCashMovement({
        date: '2026-10-20',
        type: 'otro' as never,
        concept: 'X',
        amount: 1,
      }),
    ).toBeNull();
  });

  it('debe crear cierres con conteo inválido o existente como null', () => {
    const preview = buildCashClosurePreview([], '2026-10-20', null, '2026-10-20');
    expect(createCashClosure(preview, { date: '2026-10-20', countedBalance: -1 })).toBeNull();
    expect(
      createCashClosure(
        { ...preview, existing: { id: 'x' } as never },
        { date: '2026-10-20', countedBalance: 1 },
      ),
    ).toBeNull();
  });

  it('debe sanear transferencias y rechazar altas inválidas', () => {
    expect(sanitizeCashTransfers([null, {}, { id: 'a', date: '2026-10-20' }])).toEqual([]);
    expect(
      createCashTransfer({
        date: '2026-10-20',
        fromId: 'cash',
        fromLabel: 'Caja',
        fromKind: 'cash',
        toId: 'cash',
        toLabel: 'Caja',
        toKind: 'cash',
        amount: 10,
        concept: 'X',
      }),
    ).toBeNull();
    expect(
      createCashTransfer({
        date: '2026-10-20',
        fromId: 'cash',
        fromLabel: 'Caja',
        fromKind: 'otro' as never,
        toId: 'bank',
        toLabel: 'Banco',
        toKind: 'bank',
        amount: 10,
        concept: 'X',
      }),
    ).toBeNull();
    expect(
      createCashTransfer({
        date: '20/10/2026',
        fromId: 'cash',
        fromLabel: 'Caja',
        fromKind: 'cash',
        toId: 'bank',
        toLabel: 'Banco',
        toKind: 'bank',
        amount: 10,
        concept: 'X',
      }),
    ).toBeNull();

    const transfer = createCashTransfer({
      date: '2026-10-20',
      fromId: 'bank-1',
      fromLabel: '',
      fromKind: 'bank',
      toId: 'bank-2',
      toLabel: '',
      toKind: 'bank',
      amount: 10,
      concept: '',
    })!;
    expect(transfer).toMatchObject({
      concept: 'Transferencia interna',
      notes: '',
      status: 'completado',
    });
    expect(buildTransferCashMovements(transfer)).toEqual([]);
    expect(
      computeCashTransferSummary([
        { ...transfer, status: 'anulado' },
        { ...transfer, id: 'ok' },
      ]),
    ).toEqual({ totalTransferred: 10, transfersCount: 2, cancelledCount: 1 });
  });
});
