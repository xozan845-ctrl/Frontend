import { TestBed } from '@angular/core/testing';
import { InvoiceStatus } from '../../models/billing.model';
import { InvoiceStatusBadgeComponent } from './invoice-status-badge.component';

describe('InvoiceStatusBadgeComponent', () => {
  const setup = async (status: InvoiceStatus) => {
    await TestBed.configureTestingModule({
      imports: [InvoiceStatusBadgeComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(InvoiceStatusBadgeComponent);
    fixture.componentRef.setInput('status', status);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe mostrar la etiqueta humana de cada estado con su color', async () => {
    const fixture = await setup('borrador');
    const host = fixture.nativeElement as HTMLElement;
    const cases: Array<[InvoiceStatus, string, string]> = [
      ['borrador', 'Borrador', 'badge-warning'],
      ['emitida', 'Emitida', 'badge-info'],
      ['pagada', 'Pagada', 'badge-success'],
      ['anulada', 'Anulada', 'badge-danger'],
    ];

    for (const [status, label, colorClass] of cases) {
      fixture.componentRef.setInput('status', status);
      fixture.detectChanges();
      const badge = host.querySelector('[data-testid="invoice-status-badge"]') as HTMLElement;

      expect(badge.textContent).toContain(label);
      expect(badge.className).toContain(colorClass);
    }
  });
});
