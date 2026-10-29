import { TestBed } from '@angular/core/testing';
import { CashBankModalComponent } from './cash-bank-modal.component';

describe('CashBankModalComponent', () => {
  const setup = async () => {
    await TestBed.configureTestingModule({ imports: [CashBankModalComponent] }).compileComponents();
    const fixture = TestBed.createComponent(CashBankModalComponent);
    fixture.componentRef.setInput('open', true);
    fixture.componentRef.setInput('account', null);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe emitir una cuenta bancaria válida', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;
    const save = vi.fn();
    fixture.componentInstance.save.subscribe(save);

    for (const [selector, value] of [
      ['#cash-bank-name', 'Banco Prueba'],
      ['#cash-bank-alias', 'Operativa'],
      ['#cash-bank-number', '123456789'],
      ['#cash-bank-balance', '1000'],
    ]) {
      const input = host.querySelector(selector) as HTMLInputElement;
      input.value = value;
      input.dispatchEvent(new Event('input'));
    }
    (host.querySelector('[data-testid="cash-bank-save"]') as HTMLButtonElement).click();

    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        bank: 'Banco Prueba',
        alias: 'Operativa',
        accountNumber: '123456789',
        balance: 1000,
      }),
    );
  });
});
