import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import OrdersComponent from './orders.component';
import { ORDER_REPOSITORY } from '../../../cart/public-api';
import { SeoService } from '../../../../core/services/seo.service';

describe('OrdersComponent', () => {
  const orderRepo = {
    getOrders: vi.fn(() =>
      of([
        {
          id: 'o-1',
          orderNumber: 'ORD-1',
          status: 'creada',
          total: 50,
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ]),
    ),
  };
  const seo = { setPage: vi.fn(), reset: vi.fn() };

  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [OrdersComponent],
      providers: [
        provideRouter([]),
        { provide: ORDER_REPOSITORY, useValue: orderRepo },
        { provide: SeoService, useValue: seo },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(OrdersComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    orderRepo.getOrders.mockReturnValue(
      of([
        {
          id: 'o-1',
          orderNumber: 'ORD-1',
          status: 'creada',
          total: 50,
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ]),
    );
    TestBed.resetTestingModule();
  });

  it('debe cargar y mostrar el historial de pedidos', async () => {
    const fixture = await setup();

    expect(orderRepo.getOrders).toHaveBeenCalled();
    await vi.waitFor(() => expect(fixture.componentInstance.orders()).toHaveLength(1));
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('ORD-1');
  });

  it('debe mostrar error y permitir reintentar', async () => {
    orderRepo.getOrders.mockReturnValueOnce(throwError(() => new Error('boom')));
    const fixture = await setup();

    await vi.waitFor(() => expect(fixture.componentInstance.error()).toBe('boom'));

    orderRepo.getOrders.mockReturnValueOnce(of([]));
    fixture.componentInstance.retry();

    expect(orderRepo.getOrders).toHaveBeenCalledTimes(2);
  });

  it('debe restaurar el SEO al destruirse', async () => {
    const fixture = await setup();

    fixture.destroy();

    expect(seo.reset).toHaveBeenCalled();
  });
});
