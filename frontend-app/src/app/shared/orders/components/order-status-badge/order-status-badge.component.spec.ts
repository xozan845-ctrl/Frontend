import { TestBed } from '@angular/core/testing';
import { OrderStatusBadgeComponent } from './order-status-badge.component';

describe('OrderStatusBadgeComponent', () => {
  const setup = async (status: string) => {
    await TestBed.configureTestingModule({
      imports: [OrderStatusBadgeComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(OrderStatusBadgeComponent);
    fixture.componentRef.setInput('status', status);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe mostrar estados de empresa y vendedor con su color', async () => {
    const fixture = await setup('pagada');
    const host = fixture.nativeElement as HTMLElement;
    const cases: Array<[string, string, string]> = [
      ['pendiente', 'Pendiente', 'text-amber-800'],
      ['creada', 'Creada', 'text-amber-800'],
      ['pagada', 'Pagada', 'text-emerald-800'],
      ['en_preparacion', 'En preparación', 'text-blue-800'],
      ['en_proceso', 'En proceso', 'text-blue-800'],
      ['entregada', 'Entregada', 'text-emerald-800'],
      ['completado', 'Completado', 'text-emerald-800'],
      ['cancelada', 'Cancelada', 'text-red-700'],
      ['cancelado', 'Cancelado', 'text-red-700'],
      ['devuelta', 'Devuelta', 'text-red-700'],
    ];

    for (const [status, label, colorClass] of cases) {
      fixture.componentRef.setInput('status', status);
      fixture.detectChanges();
      const badge = host.querySelector('[data-testid="order-status-badge"]') as HTMLElement;

      expect(badge.textContent).toContain(label);
      expect(badge.className).toContain(colorClass);
    }
  });

  it('debe conservar el texto de un estado desconocido con tono neutral', async () => {
    const fixture = await setup('estado_raro');
    const badge = fixture.nativeElement.querySelector(
      '[data-testid="order-status-badge"]',
    ) as HTMLElement;

    expect(badge.textContent).toContain('estado_raro');
    expect(badge.className).toContain('bg-slate-100');
  });
});
