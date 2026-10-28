import { TestBed } from '@angular/core/testing';
import { PlanCardComponent } from './plan-card.component';
import type { PlanFeature, PlanTier } from '../../models/plan.model';

const plan: PlanTier = {
  id: 'pro',
  name: 'Pro',
  popular: true,
  priceMonthly: 20,
  priceYearly: 180,
  buttonLabel: 'Mejorar a Pro',
};

const features: PlanFeature[] = [
  { name: 'Catálogo estándar', basic: true, pro: true, premium: true },
  { name: 'Descuento Global', basic: false, pro: '5%', premium: '15%' },
];

describe('PlanCardComponent', () => {
  const setup = async (currentPlan: PlanTier = plan) => {
    await TestBed.configureTestingModule({ imports: [PlanCardComponent] }).compileComponents();
    const fixture = TestBed.createComponent(PlanCardComponent);
    fixture.componentRef.setInput('plan', currentPlan);
    fixture.componentRef.setInput('features', features);
    fixture.componentRef.setInput('price', 180);
    fixture.componentRef.setInput('cycle', 'AÑO');
    fixture.detectChanges();
    return fixture;
  };

  it('debe mostrar el plan, el precio y sus features', async () => {
    const fixture = await setup();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Pro');
    expect(text).toContain('180');
    expect(text).toContain('AÑO');
    expect(text).toContain('Catálogo estándar');
    expect(text).toContain('5%');
  });

  it('debe emitir el nombre del plan al seleccionarlo', async () => {
    const fixture = await setup();
    const emit = vi.spyOn(fixture.componentInstance.planSelected, 'emit');
    const button = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('button'),
    ).find((item) => item.textContent?.includes('Mejorar a Pro'))!;

    button.click();

    expect(emit).toHaveBeenCalledWith('Pro');
  });

  it('no debe emitir si el plan ya es el actual', async () => {
    const fixture = await setup({ ...plan, id: 'basic', name: 'Básico', isCurrent: true });
    const emit = vi.spyOn(fixture.componentInstance.planSelected, 'emit');
    const button = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      'button',
    )!;

    button.click();

    expect(emit).not.toHaveBeenCalled();
  });
});
