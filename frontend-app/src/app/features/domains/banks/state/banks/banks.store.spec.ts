import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NotificationService } from '../../../../../core/services/notification/notification.service';
import { AuthStore } from '../../../../applications/auth/public-api';
import { BANKS_SCOPE_CONFIG } from '../../../../../shared/banks/constants/banks-config.tokens';
import type { BanksScopeConfig } from '../../../../../shared/banks/models/banks-config.model';
import { BanksStore } from './banks.store';
import { banksStorageKey } from '../../public-api';
import type { BankAccount } from '../../models/bank.model';

function account(overrides: Partial<BankAccount> = {}): BankAccount {
  return {
    id: 'bank-1',
    bank: 'Banco Lafise',
    alias: 'Operativa',
    accountNumber: '123456',
    type: 'ahorro',
    balance: 1000,
    ...overrides,
  };
}

const COMPANY_CONFIG: BanksScopeConfig = {
  scope: 'company',
  storageScope: 'company',
  title: 'Bancos',
  subtitle: 'Empresa',
};

const VENDOR_CONFIG: BanksScopeConfig = {
  scope: 'vendor',
  storageScope: 'store',
  title: 'Bancos',
  subtitle: 'Tienda',
};

describe('BanksStore', () => {
  const tenantId = signal<string | null>('tenant-1');
  const storeId = signal<string | null>('store-1');
  const authStore = {
    user: computed(() => ({ id: 'u-1', tenantId: tenantId(), storeId: storeId() })),
  };
  const notification = { showSuccess: vi.fn(), showError: vi.fn(), showInfo: vi.fn() };

  const setup = (config: BanksScopeConfig = COMPANY_CONFIG) => {
    TestBed.configureTestingModule({
      providers: [
        BanksStore,
        { provide: AuthStore, useValue: authStore },
        { provide: BANKS_SCOPE_CONFIG, useValue: config },
        { provide: NotificationService, useValue: notification },
      ],
    });
    return TestBed.inject(BanksStore);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    tenantId.set('tenant-1');
    storeId.set('store-1');
    TestBed.resetTestingModule();
  });

  afterEach(() => localStorage.clear());

  it('debe cargar las cuentas de empresa del tenant activo', () => {
    localStorage.setItem(
      banksStorageKey('company', 'tenant-1'),
      JSON.stringify([account({ id: 'company-record' })]),
    );
    localStorage.setItem(
      banksStorageKey('company', 'tenant-2'),
      JSON.stringify([account({ id: 'other-tenant' })]),
    );

    const store = setup();

    expect(store.accounts().map((item) => item.id)).toEqual(['company-record']);
    expect(store.summary()).toEqual({ totalBalance: 1000, accountsCount: 1 });
  });

  it('debe aislar las cuentas de la tienda de las de empresa', () => {
    localStorage.setItem(
      banksStorageKey('company', 'tenant-1'),
      JSON.stringify([account({ id: 'company-record' })]),
    );
    localStorage.setItem(
      banksStorageKey('store', 'store-1'),
      JSON.stringify([account({ id: 'store-record' })]),
    );

    const store = setup(VENDOR_CONFIG);

    expect(store.accounts().map((item) => item.id)).toEqual(['store-record']);
  });

  it('debe registrar, actualizar y eliminar cuentas', async () => {
    const store = setup();

    expect(
      store.addAccount({
        bank: '  Banco  ',
        alias: '  Caja  ',
        accountNumber: ' 1 ',
        type: 'ahorro',
        balance: 100,
      }).ok,
    ).toBe(true);
    expect(store.accounts()).toHaveLength(1);
    expect(store.summary().totalBalance).toBe(100);
    expect(notification.showSuccess).toHaveBeenCalledWith('Cuenta bancaria registrada.');

    const id = store.accounts()[0].id;
    expect(
      store.updateAccount(id, {
        bank: 'Banco',
        alias: 'Caja',
        accountNumber: '1',
        type: 'corriente',
        balance: 250,
      }).ok,
    ).toBe(true);
    expect(store.accounts()[0]).toMatchObject({ type: 'corriente', balance: 250 });
    expect(notification.showSuccess).toHaveBeenCalledWith('Cuenta bancaria actualizada.');

    store.removeAccount(id);
    expect(store.accounts()).toEqual([]);
    expect(notification.showSuccess).toHaveBeenCalledWith('Cuenta bancaria eliminada.');

    await vi.waitFor(() =>
      expect(
        JSON.parse(localStorage.getItem(banksStorageKey('company', 'tenant-1')) ?? '[]'),
      ).toEqual([]),
    );
  });

  it('debe rechazar cuentas inválidas, inexistentes y el límite', () => {
    const store = setup();

    expect(
      store.addAccount({ bank: '', alias: '', accountNumber: '', type: 'ahorro', balance: 0 }),
    ).toEqual({ ok: false, message: 'Revisa banco, alias, número y saldo de la cuenta.' });
    store.addAccount({
      bank: 'Banco',
      alias: 'Alias',
      accountNumber: '1',
      type: 'ahorro',
      balance: 0,
    });
    expect(
      store.updateAccount(store.accounts()[0].id, {
        bank: 'Banco',
        alias: 'Alias',
        accountNumber: '1',
        type: 'ahorro',
        balance: -5,
      }),
    ).toEqual({ ok: false, message: 'Revisa banco, alias, número y saldo de la cuenta.' });
    expect(
      store.updateAccount('missing', {
        bank: 'Banco',
        alias: 'Alias',
        accountNumber: '1',
        type: 'ahorro',
        balance: 0,
      }),
    ).toEqual({ ok: false, message: 'La cuenta bancaria no existe.' });

    localStorage.setItem(
      banksStorageKey('company', 'tenant-1'),
      JSON.stringify(Array.from({ length: 200 }, (_, index) => account({ id: `b-${index}` }))),
    );
    TestBed.resetTestingModule();
    const fullStore = setup();

    expect(
      fullStore.addAccount({
        bank: 'Banco',
        alias: 'Alias',
        accountNumber: '1',
        type: 'ahorro',
        balance: 0,
      }),
    ).toEqual({ ok: false, message: 'Alcanzaste el límite de cuentas bancarias.' });
  });

  it('debe ignorar storage corrupto', () => {
    localStorage.setItem(banksStorageKey('company', 'tenant-1'), '{');
    const store = setup();

    expect(store.accounts()).toEqual([]);
    expect(store.hasAccounts()).toBe(false);
  });
});
