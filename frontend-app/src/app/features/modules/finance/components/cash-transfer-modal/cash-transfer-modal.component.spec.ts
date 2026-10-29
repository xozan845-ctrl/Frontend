import { TestBed } from '@angular/core/testing';
import type { CashTransferAccount } from '../../../../domains/finance/public-api';
import { CashTransferModalComponent } from './cash-transfer-modal.component';

const ACCOUNTS: CashTransferAccount[] = [
  { id: 'cash', label: 'Caja', kind: 'cash', balance: 1000 },
  { id: 'bank-1', label: 'Banco Prueba', kind: 'bank', balance: 500 },
];

describe('CashTransferModalComponent', () => {
  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [CashTransferModalComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(CashTransferModalComponent);
    fixture.componentRef.setInput('open', true);
    fixture.componentRef.setInput('accounts', ACCOUNTS);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe emitir una transferencia de caja a banco', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;
    const save = vi.fn();
    fixture.componentInstance.save.subscribe(save);

    const amount = host.querySelector('[data-testid="transfer-amount"]') as HTMLInputElement;
    amount.value = '250';
    amount.dispatchEvent(new Event('input'));
    (host.querySelector('[data-testid="transfer-save"]') as HTMLButtonElement).click();

    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        fromId: 'cash',
        fromKind: 'cash',
        toId: 'bank-1',
        toKind: 'bank',
        amount: 250,
      }),
    );
  });
});
