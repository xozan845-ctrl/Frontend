import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import AdminOrdersComponent from './orders.component';
import { AdminOrdersStore } from '../../state/orders/admin-orders.store';
import { SeoService } from '../../../../core/services/seo/seo.service';
import type { OrderResponse, OrderTimelineEvent } from '../../../cart/public-api';

const order: OrderResponse = {
  id: 'o-1',
  orderNumber: 'ORD-O-1',
  status: 'pagada',
  total: 2300,
  createdAt: '2026-10-22T15:00:00.000Z',
  items: [
    {
      ofertaId: 'of-1',
      sku: 'SKU-1',
      name: 'Teclado',
      quantity: 2,
      unitPrice: 1150,
      storeId: 't-1',
    },
  ],
};

const timeline: OrderTimelineEvent[] = [
  {
    id: 1,
    type: 'OrderCreatedEvent',
    payload: {},
    version: 1,
    createdAt: '2026-10-22T15:00:00.000Z',
  },
];

describe('AdminOrdersComponent', () => {
  const orders = signal<OrderResponse[]>([]);
  const loading = signal(false);
  const error = signal<string | null>(null);
  const selectedOrder = signal<OrderResponse | null>(null);
  const timelineSignal = signal<OrderTimelineEvent[]>([]);
  const selectedLoading = signal(false);
  const selectedError = signal<string | null>(null);
  const updating = signal(false);
  const store = {
    orders: orders.asReadonly(),
    loading: loading.asReadonly(),
    error: error.asReadonly(),
    selectedOrder: selectedOrder.asReadonly(),
    timeline: timelineSignal.asReadonly(),
    selectedLoading: selectedLoading.asReadonly(),
    selectedError: selectedError.asReadonly(),
    updating: updating.asReadonly(),
    load: vi.fn(),
    setStatusFilter: vi.fn(),
    selectOrder: vi.fn(),
    closeOrder: vi.fn(),
    advanceStatus: vi.fn(),
  };
  const seo = { setPage: vi.fn(), reset: vi.fn() };

  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [AdminOrdersComponent],
      providers: [
        provideRouter([]),
        { provide: AdminOrdersStore, useValue: store },
        { provide: SeoService, useValue: seo },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(AdminOrdersComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    orders.set([]);
    loading.set(false);
    error.set(null);
    selectedOrder.set(null);
    timelineSignal.set([]);
    selectedLoading.set(false);
    selectedError.set(null);
    updating.set(false);
    TestBed.resetTestingModule();
  });

  it('debe cargar las órdenes al entrar', async () => {
    await setup();

    expect(store.load).toHaveBeenCalled();
  });

  it('debe listar órdenes y filtrar por estado', async () => {
    orders.set([order]);
    const fixture = await setup();

    expect(fixture.nativeElement.querySelectorAll('[data-testid="admin-order-row"]')).toHaveLength(
      1,
    );
    expect(
      fixture.nativeElement.querySelector('[data-testid="admin-order-row"]').textContent,
    ).toContain('ORD-O-1');

    const select = fixture.nativeElement.querySelector(
      '[data-testid="admin-orders-status"]',
    ) as HTMLSelectElement;
    select.value = 'pagada';
    select.dispatchEvent(new Event('change'));
    expect(store.setStatusFilter).toHaveBeenCalledWith('pagada');
  });

  it('debe seleccionar una orden y mostrar detalle con timeline', async () => {
    orders.set([order]);
    selectedOrder.set(order);
    timelineSignal.set(timeline);
    const fixture = await setup();

    expect(
      fixture.nativeElement.querySelector('[data-testid="admin-order-detail"]'),
    ).not.toBeNull();
    expect(
      fixture.nativeElement.querySelector('[data-testid="admin-order-timeline"]'),
    ).not.toBeNull();

    fixture.componentInstance.selectOrder('o-1');
    expect(store.selectOrder).toHaveBeenCalledWith('o-1');
  });

  it('debe avanzar el estado con el motivo', async () => {
    orders.set([order]);
    selectedOrder.set(order);
    const fixture = await setup();

    const status = fixture.nativeElement.querySelector(
      '[data-testid="admin-order-target-status"]',
    ) as HTMLSelectElement;
    status.value = 'enviada';
    status.dispatchEvent(new Event('change'));
    const reason = fixture.nativeElement.querySelector(
      '[data-testid="admin-order-reason"]',
    ) as HTMLInputElement;
    reason.value = 'despacho';
    reason.dispatchEvent(new Event('input'));
    fixture.componentInstance.advanceStatus();

    expect(store.advanceStatus).toHaveBeenCalledWith({ status: 'enviada', reason: 'despacho' });
  });

  it('debe mostrar el estado de carga', async () => {
    loading.set(true);
    const fixture = await setup();

    expect(fixture.nativeElement.querySelector('[role="status"]')).not.toBeNull();
  });

  it('debe mostrar los estados vacíos de lista y detalle', async () => {
    const fixture = await setup();

    expect(
      fixture.nativeElement.querySelector('[data-testid="admin-orders-empty"]'),
    ).not.toBeNull();
    expect(
      fixture.nativeElement.querySelector('[data-testid="admin-order-detail-empty"]'),
    ).not.toBeNull();
  });

  it('debe mostrar el error de carga', async () => {
    error.set('No se pudieron cargar las órdenes.');
    const fixture = await setup();

    expect(
      fixture.nativeElement.querySelector('[data-testid="admin-orders-error"]').textContent,
    ).toContain('No se pudieron cargar las órdenes.');
  });
});
