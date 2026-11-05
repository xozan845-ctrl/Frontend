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

  it('debe mostrar estados de empresa y vendedor con su tono', async () => {
    const fixture = await setup('pagada');
    const host = fixture.nativeElement as HTMLElement;
    const cases: Array<[string, string, string]> = [
      ['pendiente', 'Pendiente', 'badge-warning'],
      ['creada', 'Creada', 'badge-warning'],
      ['pagada', 'Pagada', 'badge-success'],
      ['en_preparacion', 'En preparación', 'badge-info'],
      ['en_proceso', 'En proceso', 'badge-info'],
      ['entregada', 'Entregada', 'badge-success'],
      ['completado', 'Completado', 'badge-success'],
      ['cancelada', 'Cancelada', 'badge-danger'],
      ['cancelado', 'Cancelado', 'badge-danger'],
      ['devuelta', 'Devuelta', 'badge-danger'],
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
    expect(badge.className).toContain('badge-neutral');
  });
});
