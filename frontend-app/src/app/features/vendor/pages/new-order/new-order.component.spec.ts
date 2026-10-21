import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import NewOrderComponent from './new-order.component';
import {
  VENDOR_ORDER_REPOSITORY,
  VendorOrderRepository,
} from '../../repositories/vendor-order.repository';
import { CLIENT_REPOSITORY, ClientRepository } from '../../repositories/client.repository';
import {
  VENDOR_PRODUCT_REPOSITORY,
  VendorProductRepository,
} from '../../repositories/vendor-product.repository';
import { NotificationService } from '../../../../core/services/notification.service';
import { SeoService } from '../../../../core/services/seo/seo.service';
import { ClientSearchStore } from '../../state/client-search/client-search.store';
import { OrderDraftStore } from '../../state/order-draft/order-draft.store';
import { VendorCatalogStore } from '../../state/vendor-catalog/vendor-catalog.store';
import { VendorOrdersStore } from '../../state/vendor-orders/vendor-orders.store';
import { Client, VendorOrder, VendorProduct } from '../../models/vendor-order.model';

const products: VendorProduct[] = [
  {
    id: 'vp-1',
    name: 'Shampoo Keratina',
    sku: 'KPBM-001',
    category: 'Cuidado capilar',
    price: 180,
    imageUrl: '',
    inStock: true,
  },
  {
    id: 'vp-2',
    name: 'Mascarilla Reparadora',
    sku: 'SP-002',
    category: 'Cuidado capilar',
    price: 220,
    imageUrl: '',
    inStock: true,
  },
  {
    id: 'vp-3',
    name: 'Camelia Oil',
    sku: 'CAM-003',
    category: 'Tratamientos',
    price: 195,
    imageUrl: '',
    inStock: true,
  },
  {
    id: 'vp-6',
    name: 'Sérum Reparador',
    sku: 'SR-006',
    category: 'Tratamientos',
    price: 140,
    imageUrl: '',
    inStock: false,
  },
];

const clients: Client[] = [
  {
    id: 'vc-1',
    code: 'CL-00125',
    name: 'Carla López',
    phone: '+505 8765 4321',
    email: 'carla.lopez@correo.com',
  },
  { id: 'vc-2', code: 'CL-00124', name: 'Kemuel Store', phone: '', email: '' },
];

const recentOrders: VendorOrder[] = [
  {
    id: 'PED-000125',
    clientId: 'vc-2',
    clientName: 'Kemuel Store',
    createdAt: '2026-10-15T10:32:00Z',
    status: 'en_proceso',
    total: 1339.75,
    lines: [],
    notes: '',
  },
];

const createdOrder: VendorOrder = {
  id: 'PED-000126',
  clientId: 'vc-1',
  clientName: 'Carla López',
  createdAt: '2026-10-15T16:00:00Z',
  status: 'pendiente',
  total: 207,
  lines: [],
  notes: '',
};

const createdClient: Client = {
  id: 'vc-126',
  code: 'CL-00126',
  name: 'Salón Vero',
  phone: '+505 8888 0000',
  email: 'hola@vero.com',
};

describe('NewOrderComponent (POS)', () => {
  let orderRepo: VendorOrderRepository;
  let clientRepo: ClientRepository;
  let productRepo: VendorProductRepository;
  const notification = { showSuccess: vi.fn(), showError: vi.fn(), showInfo: vi.fn() };
  const seo = { setPage: vi.fn(), reset: vi.fn() };

  const setup = async () => {
    orderRepo = {
      listOrders: vi.fn(() => of(recentOrders)),
      getOrder: vi.fn(() => of(recentOrders[0])),
      createOrder: vi.fn(() => of(createdOrder)),
      updateStatus: vi.fn(() => of(createdOrder)),
    };
    clientRepo = {
      searchClients: vi.fn(() => of(clients)),
      createClient: vi.fn(() => of(createdClient)),
    };
    productRepo = { listVendorProducts: vi.fn(() => of(products)) };
    await TestBed.configureTestingModule({
      imports: [NewOrderComponent],
      providers: [
        provideRouter([]),
        { provide: VENDOR_ORDER_REPOSITORY, useValue: orderRepo },
        { provide: CLIENT_REPOSITORY, useValue: clientRepo },
        { provide: VENDOR_PRODUCT_REPOSITORY, useValue: productRepo },
        { provide: NotificationService, useValue: notification },
        { provide: SeoService, useValue: seo },
        OrderDraftStore,
        VendorOrdersStore,
        ClientSearchStore,
        VendorCatalogStore,
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(NewOrderComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  afterEach(() => localStorage.clear());

  it('debe cargar catálogo, clientes y recientes, y fijar el SEO', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;

    expect(seo.setPage).toHaveBeenCalledWith(
      'Nuevo pedido — Panel del vendedor',
      expect.any(String),
    );
    await vi.waitFor(() =>
      expect(host.querySelectorAll('[data-testid^="product-card-"]')).toHaveLength(4),
    );
    await vi.waitFor(() =>
      expect(host.querySelectorAll('[data-testid^="client-option-"]')).toHaveLength(2),
    );
    expect(host.querySelectorAll('[data-testid="recent-order-row"]')).toHaveLength(1);
    expect(host.textContent).toContain('PED-000125');
  });

  it('debe armar el pedido actual con cantidades, descuento y totales', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;
    await vi.waitFor(() =>
      expect(host.querySelectorAll('[data-testid^="product-card-"]')).toHaveLength(4),
    );

    const add = (id: string) =>
      (
        host.querySelector(
          `[data-testid="product-card-${id}"] [data-testid="add-product"]`,
        ) as HTMLButtonElement
      ).click();
    add('vp-1');
    add('vp-1');
    add('vp-2');
    fixture.detectChanges();

    expect(host.querySelectorAll('[data-testid^="draft-line-"]')).toHaveLength(2);
    expect(host.querySelector('[data-testid="totals-subtotal"]')?.textContent).toContain(
      'C$580.00',
    );

    const line = host.querySelector('[data-testid="draft-line-vp-1"]') as HTMLElement;
    (line.querySelector('[data-testid="stepper-plus"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(host.querySelector('[data-testid="totals-subtotal"]')?.textContent).toContain(
      'C$760.00',
    );

    const discount = host.querySelector('[data-testid="discount-input"]') as HTMLInputElement;
    discount.value = '10';
    discount.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(host.querySelector('[data-testid="totals-discount"]')?.textContent).toContain('C$76.00');
    expect(host.querySelector('[data-testid="totals-total"]')?.textContent).toContain('C$786.60');
  });

  it('debe seleccionar y quitar el cliente del pedido', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;
    await vi.waitFor(() =>
      expect(host.querySelectorAll('[data-testid^="client-option-"]')).toHaveLength(2),
    );

    (host.querySelector('[data-testid="client-option-vc-1"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(host.querySelector('[data-testid="selected-client"]')?.textContent).toContain(
      'Carla López',
    );

    (host.querySelector('[data-testid="clear-client"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(host.querySelector('[data-testid="selected-client"]')).toBeNull();
  });

  it('debe registrar el pedido, limpiar el borrador y refrescar recientes', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;
    await vi.waitFor(() =>
      expect(host.querySelectorAll('[data-testid^="product-card-"]')).toHaveLength(4),
    );
    (
      host.querySelector(
        '[data-testid="product-card-vp-1"] [data-testid="add-product"]',
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();

    (host.querySelector('[data-testid="submit-order"]') as HTMLButtonElement).click();

    await vi.waitFor(() => expect(orderRepo.createOrder).toHaveBeenCalledTimes(1));
    expect(orderRepo.createOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: null,
        deliveryMethod: 'retiro_tienda',
        items: [{ productId: 'vp-1', quantity: 1 }],
      }),
    );
    expect(notification.showSuccess).toHaveBeenCalledWith('Pedido PED-000126 registrado.');

    await vi.waitFor(() =>
      expect(host.querySelectorAll('[data-testid^="draft-line-"]')).toHaveLength(0),
    );
    // El post-registro refresca "Pedidos recientes" sin esperar al polling.
    await vi.waitFor(() => expect(orderRepo.listOrders).toHaveBeenCalledTimes(2));
  });

  it('debe crear un cliente desde el modal y dejarlo seleccionado', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;

    (host.querySelector('[data-testid="new-client"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(host.querySelector('[data-testid="create-client-modal"]')).not.toBeNull();

    const dialog = host.querySelector('[data-testid="create-client-dialog"]') as HTMLElement;
    const name = dialog.querySelector('[data-testid="client-name"]') as HTMLInputElement;
    name.value = 'Salón Vero';
    name.dispatchEvent(new Event('input'));
    (dialog.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));

    await vi.waitFor(() =>
      expect(clientRepo.createClient).toHaveBeenCalledWith({
        name: 'Salón Vero',
        phone: '',
        email: '',
      }),
    );
    await vi.waitFor(() =>
      expect(host.querySelector('[data-testid="selected-client"]')?.textContent).toContain(
        'Salón Vero',
      ),
    );
    expect(host.querySelector('[data-testid="create-client-modal"]')).toBeNull();
  });

  it('debe hacer scroll a los pedidos recientes con el botón del encabezado', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;
    const section = host.querySelector('#pedidos-recientes') as HTMLElement;
    const scrollIntoView = vi.fn();
    section.scrollIntoView = scrollIntoView;

    (host.querySelector('[data-testid="goto-recent-orders"]') as HTMLButtonElement).click();

    expect(scrollIntoView).toHaveBeenCalledWith(expect.objectContaining({ block: 'start' }));
  });

  it('debe resetear el SEO al salir de la página', async () => {
    const fixture = await setup();

    fixture.destroy();

    expect(seo.reset).toHaveBeenCalled();
  });
});
