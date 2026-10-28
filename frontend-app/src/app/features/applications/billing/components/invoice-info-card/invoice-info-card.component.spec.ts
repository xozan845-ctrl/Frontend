import { TestBed } from '@angular/core/testing';
import { InvoiceInfo } from '../../models/billing.model';
import { InvoiceInfoCardComponent } from './invoice-info-card.component';

const info: InvoiceInfo = {
  storeName: 'Kemuel Store',
  date: '2026-10-19',
  paymentTerm: 'contado',
};

describe('InvoiceInfoCardComponent', () => {
  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [InvoiceInfoCardComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(InvoiceInfoCardComponent);
    fixture.componentRef.setInput('info', info);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe pintar la tienda y la fecha del borrador', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('[data-testid="billing-store-label"]')?.textContent).toContain(
      'Kemuel Store',
    );
    expect(
      (host.querySelector('[data-testid="billing-invoice-date"]') as HTMLInputElement).value,
    ).toBe('2026-10-19');
  });

  it('debe emitir la condición de pago elegida', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;
    const changes: Array<Partial<InvoiceInfo>> = [];
    fixture.componentInstance.infoChange.subscribe((value) => changes.push(value));

    (host.querySelector('[data-testid="billing-payment-credito"]') as HTMLInputElement).click();
    fixture.detectChanges();

    expect(changes.at(-1)?.paymentTerm).toBe('credito');
    expect(host.querySelector('[data-testid="billing-term-hint"]')?.textContent).toContain(
      '30 días',
    );
  });

  it('debe caer al nombre "Mi tienda" cuando no hay tienda', async () => {
    const fixture = await setup();
    fixture.componentRef.setInput('info', { ...info, storeName: '' });
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('[data-testid="billing-store-label"]')?.textContent).toContain(
      'Mi tienda',
    );
  });
});
