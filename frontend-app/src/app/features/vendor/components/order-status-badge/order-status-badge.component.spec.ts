import { TestBed } from '@angular/core/testing';
import { OrderStatusBadgeComponent } from './order-status-badge.component';
import { OrderStatus } from '../../models/vendor-order.model';

describe('OrderStatusBadgeComponent', () => {
  const setup = async (status: OrderStatus) => {
    await TestBed.configureTestingModule({
      imports: [OrderStatusBadgeComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(OrderStatusBadgeComponent);
    fixture.componentRef.setInput('status', status);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe mostrar la etiqueta humana de cada estado con su color', async () => {
    const fixture = await setup('pendiente');
    const host = fixture.nativeElement as HTMLElement;
    const cases: Array<[OrderStatus, string, string]> = [
      ['pendiente', 'Pendiente', 'text-amber-800'],
      ['en_proceso', 'En proceso', 'text-blue-800'],
      ['completado', 'Completado', 'text-emerald-800'],
      ['cancelado', 'Cancelado', 'text-red-700'],
    ];

    for (const [status, label, colorClass] of cases) {
      fixture.componentRef.setInput('status', status);
      fixture.detectChanges();
      const badge = host.querySelector('[data-testid="order-status-badge"]') as HTMLElement;

      expect(badge.textContent).toContain(label);
      expect(badge.className).toContain(colorClass);
    }
  });
});
