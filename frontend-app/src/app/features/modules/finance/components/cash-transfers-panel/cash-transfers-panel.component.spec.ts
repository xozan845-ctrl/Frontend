import { TestBed } from '@angular/core/testing';
import type { CashTransfer, CashTransferSummary } from '../../../../domains/finance/public-api';
import { CashTransfersPanelComponent } from './cash-transfers-panel.component';

const TRANSFER: CashTransfer = {
  id: 'transfer-1',
  date: '2026-10-29',
  fromId: 'cash',
  fromLabel: 'Caja',
  fromKind: 'cash',
  toId: 'bank-1',
  toLabel: 'Banco Prueba',
  toKind: 'bank',
  amount: 250,
  concept: 'Depósito',
  notes: '',
  status: 'completado',
  createdAt: '2026-10-29T12:00:00Z',
};
const SUMMARY: CashTransferSummary = {
  totalTransferred: 250,
  transfersCount: 1,
  cancelledCount: 0,
};

describe('CashTransfersPanelComponent', () => {
  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [CashTransfersPanelComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(CashTransfersPanelComponent);
    fixture.componentRef.setInput('transfers', [TRANSFER]);
    fixture.componentRef.setInput('summary', SUMMARY);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe mostrar la transferencia y emitir su anulación', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;
    const cancel = vi.fn();
    fixture.componentInstance.requestCancel.subscribe(cancel);

    expect(host.textContent).toContain('Banco Prueba');
    expect(host.textContent).toContain('250.00');
    (host.querySelector('[data-testid="transfer-cancel"]') as HTMLButtonElement).click();
    expect(cancel).toHaveBeenCalledWith('transfer-1');
  });
});
