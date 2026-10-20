import { TestBed } from '@angular/core/testing';
import { DeliverySegment } from '../../models/logistica.model';
import { DeliveriesDonutComponent } from './deliveries-donut.component';

const segments: readonly DeliverySegment[] = [
  { status: 'entregado', label: 'Entregados', count: 24, percent: 57, tone: 'green' },
  { status: 'en_ruta', label: 'En ruta', count: 18, percent: 43, tone: 'blue' },
  { status: 'pendiente', label: 'Pendientes', count: 6, percent: 14, tone: 'amber' },
  { status: 'incidencia', label: 'Incidencias', count: 4, percent: 10, tone: 'red' },
];

describe('DeliveriesDonutComponent', () => {
  const setup = async (data: readonly DeliverySegment[] = segments, total = 42) => {
    await TestBed.configureTestingModule({
      imports: [DeliveriesDonutComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(DeliveriesDonutComponent);
    fixture.componentRef.setInput('segments', data);
    fixture.componentRef.setInput('total', total);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe pintar la leyenda con conteo y porcentaje de cada estado', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelectorAll('[data-testid^="delivery-legend-"]')).toHaveLength(4);
    expect(host.textContent).toContain('Entregados');
    expect(host.textContent).toContain('24');
    expect(host.textContent).toContain('57%');
    expect(host.textContent).toContain('Incidencias');
    expect(host.textContent).toContain('10%');
  });

  it('debe mostrar el total de pedidos en el centro del donut', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.textContent).toContain('42');
    expect(host.textContent).toContain('pedidos');
  });

  it('debe exponer el donut como imagen accesible con su resumen (R-AC-4)', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;
    const svg = host.querySelector('svg');

    expect(svg?.getAttribute('role')).toBe('img');
    expect(svg?.getAttribute('aria-label')).toContain('Estado de entregas');
    expect(svg?.getAttribute('aria-label')).toContain('24 entregados');
  });

  it('debe normalizar los segmentos y dibujar un arco por estado', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;
    const arcs = host.querySelectorAll('svg circle[stroke-dasharray]');

    expect(arcs).toHaveLength(4);
    expect(arcs[0].getAttribute('stroke')).toBe('#22c55e');
    expect(arcs[0].getAttribute('stroke-dasharray')).toMatch(/^\d+(\.\d+)? \d+(\.\d+)?$/);
  });

  it('debe tolerar un tablero sin entregas sin romper el anillo', async () => {
    const fixture = await setup([], 0);
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelectorAll('svg circle[stroke-dasharray]')).toHaveLength(0);
    expect(host.textContent).toContain('0');
  });
});
