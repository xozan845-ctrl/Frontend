import { TestBed } from '@angular/core/testing';
import { NotificationService } from '../../core/services/notification.service';
import { SeoService } from '../../core/services/seo.service';
import PlansComponent from './plans.component';

describe('PlansComponent', () => {
  const notification = { showSuccess: vi.fn() };
  const seo = { setPage: vi.fn(), reset: vi.fn() };

  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [PlansComponent],
      providers: [
        { provide: NotificationService, useValue: notification },
        { provide: SeoService, useValue: seo },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(PlansComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => vi.clearAllMocks());

  it('debe mostrar precios mensuales por defecto', async () => {
    const fixture = await setup();

    expect(fixture.componentInstance.billingType()).toBe('personal');
    expect(fixture.componentInstance.getPlanPrice(fixture.componentInstance.plans[1])).toBe(20);
    expect(fixture.componentInstance.getBillingCycleText()).toBe('MES');
  });

  it('debe cambiar a precios anuales al elegir empresa', async () => {
    const fixture = await setup();
    const companyButton = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('button'),
    ).find((button) => button.textContent?.trim() === 'Empresa')!;

    companyButton.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.billingType()).toBe('empresa');
    expect(fixture.componentInstance.getPlanPrice(fixture.componentInstance.plans[1])).toBe(180);
    expect(fixture.componentInstance.getBillingCycleText()).toBe('AÑO');
  });

  it('debe notificar la selección del plan Pro con el tipo de facturación', async () => {
    const fixture = await setup();
    const proButton = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('button'),
    ).find((button) => button.textContent?.includes('Mejorar a Pro'))!;

    proButton.click();

    expect(notification.showSuccess).toHaveBeenCalledWith(
      'Plan Pro (personal) seleccionado. Redirigiendo a checkout...',
    );
  });

  it('debe avisar que ventas contactará al seleccionar Premium', async () => {
    const fixture = await setup();
    const premiumButton = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('button'),
    ).find((button) => button.textContent?.includes('Contactar'))!;

    premiumButton.click();

    expect(notification.showSuccess).toHaveBeenCalledWith(
      'Un especialista de ventas se contactará contigo a la brevedad.',
    );
  });
});
