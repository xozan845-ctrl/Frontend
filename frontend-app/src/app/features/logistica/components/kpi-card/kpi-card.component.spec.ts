import { TestBed } from '@angular/core/testing';
import { KpiTone } from '../../models/logistica.model';
import { KpiCardComponent } from './kpi-card.component';

interface SetupOptions {
  tone?: KpiTone;
  hint?: string;
}

describe('KpiCardComponent', () => {
  const setup = async (overrides: SetupOptions = {}) => {
    await TestBed.configureTestingModule({ imports: [KpiCardComponent] }).compileComponents();
    const fixture = TestBed.createComponent(KpiCardComponent);
    fixture.componentRef.setInput('label', 'Pedidos en tránsito');
    fixture.componentRef.setInput('value', '18');
    fixture.componentRef.setInput('hint', overrides.hint ?? 'en ruta actualmente');
    fixture.componentRef.setInput('icon', 'fa-solid fa-box');
    fixture.componentRef.setInput('tone', overrides.tone ?? 'amber');
    fixture.componentRef.setInput('testId', 'kpi-transito');
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe mostrar la etiqueta, el valor y la pista de la tarjeta', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.textContent).toContain('Pedidos en tránsito');
    expect(host.textContent).toContain('18');
    expect(host.textContent).toContain('en ruta actualmente');
    expect(host.querySelector('[data-testid="kpi-transito"]')).not.toBeNull();
  });

  it('debe aplicar el tono visual recibido', async () => {
    const fixture = await setup({ tone: 'blue' });
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('article')?.className).toContain('bg-blue-50/50');
  });

  it('debe omitir la pista cuando llega vacía', async () => {
    const fixture = await setup({ hint: '' });
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelectorAll('p')).toHaveLength(2);
  });
});
