import { TestBed } from '@angular/core/testing';
import type { BankAccount, BanksSummary } from '../../../../domains/banks/public-api';
import { CashBanksPanelComponent } from './cash-banks-panel.component';

const ACCOUNT: BankAccount = {
  id: 'bank-1',
  bank: 'Banco Prueba',
  alias: 'Operativa',
  accountNumber: '123456789',
  type: 'ahorro',
  balance: 1000,
};
const SUMMARY: BanksSummary = { totalBalance: 1000, accountsCount: 1 };

describe('CashBanksPanelComponent', () => {
  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [CashBanksPanelComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(CashBanksPanelComponent);
    fixture.componentRef.setInput('accounts', [ACCOUNT]);
    fixture.componentRef.setInput('summary', SUMMARY);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe mostrar la cuenta enmascarada y emitir acciones', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;
    const edit = vi.fn();
    fixture.componentInstance.edit.subscribe(edit);

    expect(host.textContent).toContain('Banco Prueba');
    expect(host.textContent).toContain('•••• 6789');
    expect(host.textContent).toContain('Ahorro');
    (host.querySelector('[data-testid="bank-edit"]') as HTMLButtonElement).click();
    expect(edit).toHaveBeenCalledWith(ACCOUNT);
  });
});
