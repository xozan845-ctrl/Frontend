import { TestBed } from '@angular/core/testing';
import type { CashMovement } from '../../../../domains/finance/public-api';
import { CashExportModalComponent } from './cash-export-modal.component';

function movement(): CashMovement {
  const date = new Date().toISOString().slice(0, 10);
  return {
    id: 'cash-1',
    date,
    createdAt: `${date}T12:00:00Z`,
    type: 'ingreso',
    concept: 'Venta',
    amount: 100,
    currency: 'NIO',
    originalAmount: 100,
    exchangeRate: 1,
    paymentMethod: 'efectivo',
    category: 'venta',
    source: 'venta',
    status: 'completado',
    reference: 'V-1',
    observations: '',
  };
}

describe('CashExportModalComponent', () => {
  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [CashExportModalComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(CashExportModalComponent);
    fixture.componentRef.setInput('open', true);
    fixture.componentRef.setInput('movements', [movement()]);
    fixture.componentRef.setInput('methods', []);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe resumir el reporte y habilitar la exportación', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;

    expect(fixture.componentInstance.report().count).toBe(1);
    expect(host.querySelector('[data-testid="cash-export-dialog"]')).not.toBeNull();
    expect(host.textContent).toContain('1 movimientos');
    expect(
      (host.querySelector('[data-testid="cash-export-excel"]') as HTMLButtonElement).disabled,
    ).toBe(false);
  });
});
