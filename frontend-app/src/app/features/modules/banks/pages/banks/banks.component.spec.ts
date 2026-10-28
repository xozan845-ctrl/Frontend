import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SeoService } from '../../../../../core/services/seo/seo.service';
import { BANKS_SCOPE_CONFIG } from '../../../../../shared/banks/constants/banks-config.tokens';
import type { BanksScopeConfig } from '../../../../../shared/banks/models/banks-config.model';
import { BanksStore, type BankAccount } from '../../../../domains/banks/public-api';
import BanksComponent from './banks.component';

const config: BanksScopeConfig = {
  scope: 'company',
  storageScope: 'company',
  title: 'Bancos',
  subtitle: 'Cuentas de la empresa',
};

const account: BankAccount = {
  id: 'bank-1',
  bank: 'Banco Lafise',
  alias: 'Operativa',
  accountNumber: '123456',
  type: 'ahorro',
  balance: 1000,
};

describe('BanksComponent', () => {
  const store = {
    accounts: signal([account]),
    summary: signal({ totalBalance: 1000, accountsCount: 1 }),
    hasAccounts: signal(true),
    addAccount: vi.fn(),
    updateAccount: vi.fn(),
    removeAccount: vi.fn(),
  };

  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [BanksComponent],
      providers: [
        { provide: BanksStore, useValue: store },
        { provide: BANKS_SCOPE_CONFIG, useValue: config },
        { provide: SeoService, useValue: { setPage: vi.fn(), reset: vi.fn() } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(BanksComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('debe mostrar KPIs y las cuentas con su tipo', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.textContent).toContain('Bancos');
    expect(host.textContent).toContain('Cuentas de la empresa');
    expect(host.textContent).toContain('C$1,000.00');
    expect(host.textContent).toContain('Ahorro');
    expect(host.querySelector('[data-testid="banks-table"]')).not.toBeNull();
  });

  it('debe registrar una cuenta nueva', async () => {
    const fixture = await setup();

    fixture.componentInstance.save({
      bank: 'Banco',
      alias: 'Caja',
      accountNumber: '1',
      type: 'ahorro',
      balance: 100,
    });

    expect(store.addAccount).toHaveBeenCalled();
    expect(store.updateAccount).not.toHaveBeenCalled();
    expect(fixture.componentInstance.editing()).toBeNull();
  });

  it('debe editar una cuenta existente y cancelar', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;

    (host.querySelector('[data-testid="bank-edit"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.componentInstance.editing()).toEqual(account);

    fixture.componentInstance.save({
      bank: 'Banco Lafise',
      alias: 'Operativa',
      accountNumber: '123456',
      type: 'ahorro',
      balance: 1200,
    });
    expect(store.updateAccount).toHaveBeenCalledWith('bank-1', {
      bank: 'Banco Lafise',
      alias: 'Operativa',
      accountNumber: '123456',
      type: 'ahorro',
      balance: 1200,
    });
    expect(fixture.componentInstance.editing()).toBeNull();

    fixture.componentInstance.edit(account);
    fixture.componentInstance.cancelEdit();
    expect(fixture.componentInstance.editing()).toBeNull();
  });

  it('debe delegar el borrado en el store', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;

    (host.querySelector('[data-testid="bank-remove"]') as HTMLButtonElement).click();

    expect(store.removeAccount).toHaveBeenCalledWith('bank-1');
  });
});
