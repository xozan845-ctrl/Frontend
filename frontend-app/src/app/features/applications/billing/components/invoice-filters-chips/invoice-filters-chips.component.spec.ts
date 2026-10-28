import { TestBed } from '@angular/core/testing';
import { INVOICE_STATUSES } from '../../constants/billing.constants';
import { InvoiceStatus } from '../../models/billing.model';
import { InvoiceFiltersChipsComponent } from './invoice-filters-chips.component';

const counts: Record<InvoiceStatus, number> = {
  borrador: 1,
  emitida: 2,
  pagada: 3,
  anulada: 4,
};

describe('InvoiceFiltersChipsComponent', () => {
  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [InvoiceFiltersChipsComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(InvoiceFiltersChipsComponent);
    fixture.componentRef.setInput('statuses', INVOICE_STATUSES);
    fixture.componentRef.setInput('counts', counts);
    fixture.componentRef.setInput('total', 10);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe pintar todos los estados con su conteo', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('[data-testid="billing-count-all"]')?.textContent).toContain('10');
    expect(host.querySelector('[data-testid="billing-count-borrador"]')?.textContent).toContain(
      '1',
    );
    expect(host.querySelector('[data-testid="billing-count-pagada"]')?.textContent).toContain('3');
  });

  it('debe emitir el filtro elegido y el estado "todas"', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;
    const emitted: Array<InvoiceStatus | null> = [];
    fixture.componentInstance.selectedChange.subscribe((value) => emitted.push(value));

    (host.querySelector('[data-testid="billing-filter-emitida"]') as HTMLButtonElement).click();
    (host.querySelector('[data-testid="billing-filter-all"]') as HTMLButtonElement).click();

    expect(emitted).toEqual(['emitida', null]);
  });
});
