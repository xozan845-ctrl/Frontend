import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import OrderDetailComponent from './order-detail.component';
import { ORDER_REPOSITORY } from '../../../cart/public-api';
import { SeoService } from '../../../../core/services/seo.service';

describe('OrderDetailComponent', () => {
  const orderRepo = {
    getOrder: vi.fn(() =>
      of({
        id: 'o-1',
        orderNumber: 'ORD-1',
        status: 'creada',
        total: 50,
        createdAt: '2026-01-01T00:00:00.000Z',
        items: [],
      }),
    ),
    getTimeline: vi.fn(() =>
      of([{ id: 1, type: 'orden.creada', payload: {}, version: 1, createdAt: '2026-01-01' }]),
    ),
  };
  const seo = { setPage: vi.fn(), reset: vi.fn() };

  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [OrderDetailComponent],
      providers: [
        provideRouter([]),
        { provide: ORDER_REPOSITORY, useValue: orderRepo },
        { provide: SeoService, useValue: seo },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(OrderDetailComponent);
    fixture.componentRef.setInput('id', 'o-1');
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    orderRepo.getOrder.mockReturnValue(
      of({
        id: 'o-1',
        orderNumber: 'ORD-1',
        status: 'creada',
        total: 50,
        createdAt: '2026-01-01T00:00:00.000Z',
        items: [],
      }),
    );
    orderRepo.getTimeline.mockReturnValue(
      of([{ id: 1, type: 'orden.creada', payload: {}, version: 1, createdAt: '2026-01-01' }]),
    );
    TestBed.resetTestingModule();
  });

  it('debe cargar la orden y su timeline', async () => {
    const fixture = await setup();

    await vi.waitFor(() => expect(fixture.componentInstance.order()).not.toBeNull());
    expect(orderRepo.getOrder).toHaveBeenCalledWith('o-1');
    expect(orderRepo.getTimeline).toHaveBeenCalledWith('o-1');
    expect(fixture.componentInstance.timeline()).toHaveLength(1);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('ORD-1');
  });

  it('debe tolerar que el timeline falle (best-effort)', async () => {
    orderRepo.getTimeline.mockReturnValueOnce(throwError(() => new Error('boom')));
    const fixture = await setup();

    await vi.waitFor(() => expect(fixture.componentInstance.order()).not.toBeNull());
    expect(fixture.componentInstance.timeline()).toEqual([]);
    expect(fixture.componentInstance.error()).toBeNull();
  });

  it('debe restaurar el SEO al destruirse', async () => {
    const fixture = await setup();

    fixture.destroy();

    expect(seo.reset).toHaveBeenCalled();
  });
});
