import {
  computeBanksSummary,
  createBankAccount,
  sanitizeBankAccounts,
  updateBankAccount,
} from './banks.adapter';
import type { BankAccount } from '../../models/bank.model';

const ACCOUNT: BankAccount = {
  id: 'bank-1',
  bank: 'Banco Lafise',
  alias: 'Operativa',
  accountNumber: '123456',
  type: 'ahorro',
  balance: 1000,
};

describe('banks.adapter', () => {
  it('debe normalizar cuentas válidas y descartar inválidas', () => {
    const accounts = sanitizeBankAccounts([
      ACCOUNT,
      { ...ACCOUNT, id: '' },
      { ...ACCOUNT, balance: -1 },
      { ...ACCOUNT, type: 'otra' },
      'no-es-cuenta',
    ]);

    expect(accounts).toEqual([ACCOUNT]);
  });

  it('debe tolerar entradas que no son listas y respetar el límite', () => {
    expect(sanitizeBankAccounts(null)).toEqual([]);
    expect(sanitizeBankAccounts({})).toEqual([]);
    expect(
      sanitizeBankAccounts(
        Array.from({ length: 205 }, (_, index) => ({ ...ACCOUNT, id: `b-${index}` })),
      ),
    ).toHaveLength(200);
  });

  it('debe crear y actualizar cuentas con datos normalizados', () => {
    const created = createBankAccount({
      bank: '  Banco  ',
      alias: '  Caja  ',
      accountNumber: ' 999 ',
      type: 'corriente',
      balance: 25.555,
    });

    expect(created).toMatchObject({
      bank: 'Banco',
      alias: 'Caja',
      accountNumber: '999',
      type: 'corriente',
      balance: 25.56,
    });
    expect(updateBankAccount(ACCOUNT, { ...ACCOUNT, alias: 'Nueva', balance: 10 })).toMatchObject({
      id: 'bank-1',
      alias: 'Nueva',
      balance: 10,
    });
  });

  it('debe rechazar payloads inválidos', () => {
    expect(
      createBankAccount({
        bank: '',
        alias: '',
        accountNumber: '',
        type: 'ahorro',
        balance: 0,
      }),
    ).toBeNull();
    expect(
      updateBankAccount(ACCOUNT, {
        bank: 'Banco',
        alias: 'Alias',
        accountNumber: '1',
        type: 'ahorro',
        balance: -5,
      }),
    ).toBeNull();
  });

  it('debe generar un id alternativo sin crypto.randomUUID', () => {
    const original = globalThis.crypto;
    vi.stubGlobal('crypto', {});
    try {
      expect(
        createBankAccount({
          bank: 'Banco',
          alias: 'Alias',
          accountNumber: '1',
          type: 'wallet',
          balance: 0,
        })?.id,
      ).toMatch(/^bank-/);
    } finally {
      vi.stubGlobal('crypto', original);
    }
  });

  it('debe sumar el saldo de las cuentas', () => {
    expect(computeBanksSummary([ACCOUNT, { ...ACCOUNT, id: 'bank-2', balance: 500.5 }])).toEqual({
      totalBalance: 1500.5,
      accountsCount: 2,
    });
  });
});
