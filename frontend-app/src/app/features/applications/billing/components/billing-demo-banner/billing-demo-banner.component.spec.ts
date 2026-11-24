import { TestBed } from '@angular/core/testing';
import { BillingDemoBannerComponent } from './billing-demo-banner.component';

describe('BillingDemoBannerComponent', () => {
  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [BillingDemoBannerComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(BillingDemoBannerComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe identificar la facturación como demo sin prometer operación real', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.textContent).toContain('Demo');
    expect(host.textContent).toContain('acciones reales');
    expect(host.querySelector('[data-testid="billing-demo-banner"]')).not.toBeNull();
  });
});
