import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { OrderDraftStore } from './order-draft.store';
import {
  VENDOR_ORDER_REPOSITORY,
  VendorOrderRepository,
} from '../../repositories/vendor-order.repository';
import { NotificationService } from '../../../../../core/services/notification/notification.service';
import { VENDOR_DRAFT_STORAGE_KEY } from '../../constants/vendor.constants';
import {
  Client,
  DeliveryMethod,
  VendorOrder,
  VendorProduct,
} from '../../models/vendor-order.model';

const product = (id: string, price: number, inStock = true): VendorProduct => ({
  id,
  name: `Producto ${id}`,
  sku: `SKU-${id}`,
  category: 'Categoría',
  price,
  imageUrl: '',
  inStock,
});

const client: Client = {
  id: 'vc-1',
  code: 'CL-00125',
  name: 'Carla López',
  phone: '+505 8765 4321',
  email: 'carla.lopez@correo.com',
};

const order: VendorOrder = {
  id: 'PED-000126',
  clientId: 'vc-1',
  clientName: 'Carla López',
  createdAt: '2026-10-15T16:00:00Z',
  status: 'pendiente',
  total: 1339.75,
  lines: [],
  notes: '',
};

describe('OrderDraftStore', () => {
  let repo: VendorOrderRepository;
  const notification = { showSuccess: vi.fn(), showError: vi.fn(), showInfo: vi.fn() };

  const setup = () => {
    repo = {
      listOrders: vi.fn(() => of([])),
      getOrder: vi.fn(() => of(order)),
      createOrder: vi.fn(() => of(order)),
      updateStatus: vi.fn(() => of(order)),
    };
    TestBed.configureTestingModule({
      providers: [
        OrderDraftStore,
        { provide: VENDOR_ORDER_REPOSITORY, useValue: repo },
        { provide: NotificationService, useValue: notification },
      ],
    });
    return TestBed.inject(OrderDraftStore);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  afterEach(() => localStorage.clear());

  it('debe iniciar con un borrador vacío y la fecha de hoy', () => {
    const draft = setup();

    expect(draft.client()).toBeNull();
    expect(draft.lines()).toEqual([]);
    expect(draft.discountPercent()).toBe(0);
    expect(draft.subtotal()).toBe(0);
    expect(draft.total()).toBe(0);
    expect(draft.isEmpty()).toBe(true);
    expect(draft.info().deliveryMethod).toBe('retiro_tienda');
    expect(draft.info().date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('debe seleccionar cliente y actualizar la información del pedido', () => {
    const draft = setup();

    draft.selectClient(client);
    draft.setOrderInfo({
      storeId: 't-1',
      storeName: 'Mi Tienda',
      deliveryMethod: 'envio_domicilio',
      date: '2026-10-20',
    });

    expect(draft.client()).toEqual(client);
    expect(draft.info()).toMatchObject({
      storeId: 't-1',
      storeName: 'Mi Tienda',
      deliveryMethod: 'envio_domicilio',
      date: '2026-10-20',
    });

    draft.selectClient(null);
    expect(draft.client()).toBeNull();
  });

  it('debe sanear la info del pedido (fecha inválida y método desconocido)', () => {
    const draft = setup();

    draft.setOrderInfo({ date: 'no-es-fecha' });
    expect(draft.info().date).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    draft.setOrderInfo({ deliveryMethod: 'gasoducto' as unknown as DeliveryMethod });
    expect(draft.info().deliveryMethod).toBe('retiro_tienda');
  });

  it('debe agregar líneas y sumar unidades al repetir el producto', () => {
    const draft = setup();
    const before = draft.lines();

    draft.addLine(product('p-1', 180));
    draft.addLine(product('p-1', 180));
    draft.addLine(product('p-2', 220));

    expect(draft.lines()).toHaveLength(2);
    expect(draft.lines()[0].quantity).toBe(2);
    expect(draft.lines()[1].quantity).toBe(1);
    expect(draft.lineCount()).toBe(3);
    expect(draft.isEmpty()).toBe(false);
    expect(before).toHaveLength(0);
  });

  it('no debe agregar productos sin existencias', () => {
    const draft = setup();

    draft.addLine(product('p-6', 180, false));

    expect(draft.lines()).toHaveLength(0);
  });

  it('debe sanear la cantidad de la línea (0 → 1, exceso → 999, trunca decimales)', () => {
    const draft = setup();
    draft.addLine(product('p-1', 180));

    draft.updateQuantity('p-1', 0);
    expect(draft.lines()[0].quantity).toBe(1);

    draft.updateQuantity('p-1', 1500);
    expect(draft.lines()[0].quantity).toBe(999);

    draft.updateQuantity('p-1', 4.9);
    expect(draft.lines()[0].quantity).toBe(4);

    draft.updateQuantity('p-1', Number.NaN);
    expect(draft.lines()[0].quantity).toBe(1);

    draft.updateQuantity('p-inexistente', 8);
    expect(draft.lines()).toHaveLength(1);
  });

  it('debe quitar líneas sin mutar el arreglo anterior', () => {
    const draft = setup();
    draft.addLine(product('p-1', 180));
    draft.addLine(product('p-2', 220));
    const before = draft.lines();

    draft.removeLine('p-1');

    expect(draft.lines()).toHaveLength(1);
    expect(draft.lines()[0].product.id).toBe('p-2');
    expect(before).toHaveLength(2);
  });

  it('debe calcular subtotal, descuento, IVA y total con redondeo a 2 decimales', () => {
    const draft = setup();
    draft.addLine(product('p-1', 180));
    draft.addLine(product('p-1', 180));
    draft.addLine(product('p-2', 220));
    draft.addLine(product('p-3', 195));
    draft.addLine(product('p-3', 195));
    draft.addLine(product('p-3', 195));

    expect(draft.subtotal()).toBe(1165);
    expect(draft.discountAmount()).toBe(0);
    expect(draft.taxAmount()).toBe(174.75);
    expect(draft.total()).toBe(1339.75);

    draft.setDiscountPercent(10);
    expect(draft.discountAmount()).toBe(116.5);
    expect(draft.taxAmount()).toBe(157.28);
    expect(draft.total()).toBe(1205.78);

    draft.setDiscountPercent(100);
    expect(draft.discountAmount()).toBe(1165);
    expect(draft.taxAmount()).toBe(0);
    expect(draft.total()).toBe(0);
  });

  it('debe sanear el descuento a 0–100', () => {
    const draft = setup();

    draft.setDiscountPercent(150);
    expect(draft.discountPercent()).toBe(100);

    draft.setDiscountPercent(-5);
    expect(draft.discountPercent()).toBe(0);

    draft.setDiscountPercent(Number.NaN);
    expect(draft.discountPercent()).toBe(0);

    draft.setDiscountPercent(12.345);
    expect(draft.discountPercent()).toBe(12.35);
  });

  it('debe persistir el borrador y quitarlo al limpiar', async () => {
    const draft = setup();
    draft.selectClient(client);
    draft.addLine(product('p-1', 180));
    draft.setObservations('Entregar por la tarde');

    await vi.waitFor(() => {
      const stored = JSON.parse(localStorage.getItem(VENDOR_DRAFT_STORAGE_KEY) ?? 'null');
      expect(stored?.lines).toHaveLength(1);
      expect(stored?.observations).toBe('Entregar por la tarde');
    });

    draft.clearDraft();
    expect(localStorage.getItem(VENDOR_DRAFT_STORAGE_KEY)).toBeNull();
    expect(draft.client()).toBeNull();
    expect(draft.lines()).toEqual([]);
    expect(draft.observations()).toBe('');
  });

  it('debe conservar la tienda al limpiar el borrador', () => {
    const draft = setup();
    draft.setOrderInfo({ storeId: 't-1', storeName: 'Mi Tienda' });
    draft.addLine(product('p-1', 180));

    draft.clearDraft();

    expect(draft.info().storeId).toBe('t-1');
    expect(draft.info().storeName).toBe('Mi Tienda');
    expect(draft.lines()).toEqual([]);
  });

  it('debe hidratar el borrador guardado al crear el store', () => {
    localStorage.setItem(
      VENDOR_DRAFT_STORAGE_KEY,
      JSON.stringify({
        client: { id: 'vc-1', code: 'CL-00125', name: 'Carla López', phone: '', email: '' },
        info: {
          storeId: 't-1',
          storeName: 'Mi Tienda',
          date: '2026-10-20',
          deliveryMethod: 'envio_domicilio',
        },
        lines: [{ product: product('p-1', 180), quantity: 2 }],
        discountPercent: 5,
        observations: 'Sin prisa',
      }),
    );

    const draft = setup();

    expect(draft.client()?.name).toBe('Carla López');
    expect(draft.info()).toMatchObject({
      storeId: 't-1',
      deliveryMethod: 'envio_domicilio',
      date: '2026-10-20',
    });
    expect(draft.lines()).toHaveLength(1);
    expect(draft.lines()[0].quantity).toBe(2);
    expect(draft.subtotal()).toBe(360);
    expect(draft.total()).toBe(393.3);
  });

  it('debe tolerar JSON corrupto y sanear datos raros del storage', () => {
    localStorage.setItem(VENDOR_DRAFT_STORAGE_KEY, '{corrupto');
    let draft = setup();

    expect(draft.lines()).toEqual([]);
    expect(draft.client()).toBeNull();
    expect(draft.observations()).toBe('');

    TestBed.resetTestingModule();
    localStorage.setItem(
      VENDOR_DRAFT_STORAGE_KEY,
      JSON.stringify({
        client: { id: 7 },
        info: { date: '17/10/2026', deliveryMethod: 'dron' },
        lines: [
          'x',
          { product: { id: '' } },
          { product: { id: 'p-2', price: 'mucho' }, quantity: -3 },
          { product: { id: 'p-3' }, quantity: 2.9 },
          { product: { id: 'p-3' }, quantity: 5 },
          { product: { id: 'p-4' }, quantity: 'mucho' },
        ],
        discountPercent: '250',
        observations: 42,
      }),
    );
    draft = setup();

    expect(draft.client()).toBeNull();
    expect(draft.info().deliveryMethod).toBe('retiro_tienda');
    expect(draft.info().date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(draft.lines()).toHaveLength(3);
    expect(draft.lines()[0]).toMatchObject({
      product: { id: 'p-2', name: 'Producto', price: 0, inStock: true },
      quantity: 1,
    });
    expect(draft.lines()[1].quantity).toBe(2);
    expect(draft.lines()[2].quantity).toBe(1);
    expect(draft.discountPercent()).toBe(100);
    expect(draft.observations()).toBe('');
  });

  it('debe ignorar un storage que no es un objeto JSON', () => {
    localStorage.setItem(VENDOR_DRAFT_STORAGE_KEY, '"solo texto"');

    const draft = setup();

    expect(draft.lines()).toEqual([]);
    expect(draft.client()).toBeNull();
  });

  it('debe iniciar vacío cuando el storage no está disponible', () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });

    const draft = setup();

    expect(draft.lines()).toEqual([]);
    expect(draft.client()).toBeNull();
    getItem.mockRestore();
  });

  it('debe confirmar y persistir con Guardar borrador', () => {
    const draft = setup();
    draft.addLine(product('p-1', 180));

    draft.saveDraft();

    expect(notification.showSuccess).toHaveBeenCalledWith('Borrador del pedido guardado.');
    const stored = JSON.parse(localStorage.getItem(VENDOR_DRAFT_STORAGE_KEY) ?? 'null');
    expect(stored?.lines).toHaveLength(1);
  });

  it('debe registrar el pedido, notificar y limpiar el borrador', async () => {
    const draft = setup();
    const date = draft.info().date;
    draft.selectClient(client);
    draft.setOrderInfo({ storeId: 't-1', storeName: 'Mi Tienda' });
    draft.addLine(product('p-1', 180));
    draft.addLine(product('p-1', 180));
    draft.addLine(product('p-2', 220));
    draft.addLine(product('p-3', 195));
    draft.addLine(product('p-3', 195));
    draft.addLine(product('p-3', 195));
    draft.setObservations('Entregar por la tarde');

    draft.submitOrder();
    await vi.waitFor(() => expect(draft.lastCreatedOrder()).toEqual(order));

    expect(repo.createOrder).toHaveBeenCalledWith({
      clientId: 'vc-1',
      storeId: 't-1',
      date,
      deliveryMethod: 'retiro_tienda',
      discountPercent: 0,
      observations: 'Entregar por la tarde',
      items: [
        { productId: 'p-1', quantity: 2 },
        { productId: 'p-2', quantity: 1 },
        { productId: 'p-3', quantity: 3 },
      ],
    });
    expect(notification.showSuccess).toHaveBeenCalledWith('Pedido PED-000126 registrado.');
    expect(draft.lines()).toEqual([]);
    expect(draft.client()).toBeNull();
    expect(draft.observations()).toBe('');
    expect(draft.info().storeId).toBe('t-1');
    expect(draft.info().storeName).toBe('Mi Tienda');
    expect(draft.submitting()).toBe(false);
  });

  it('no debe registrar un pedido sin líneas', async () => {
    const draft = setup();

    draft.submitOrder();
    await vi.waitFor(() => expect(draft.error()).not.toBeNull());

    expect(repo.createOrder).not.toHaveBeenCalled();
    expect(notification.showError).toHaveBeenCalledWith(
      'Agrega al menos un producto para registrar el pedido.',
    );
    expect(draft.submitting()).toBe(false);
  });

  it('debe conservar el borrador cuando el registro falla', async () => {
    const draft = setup();
    draft.addLine(product('p-1', 180));
    vi.mocked(repo.createOrder).mockReturnValue(throwError(() => new Error('sin conexión')));

    draft.submitOrder();
    await vi.waitFor(() => expect(draft.error()).toBe('sin conexión'));

    expect(draft.lines()).toHaveLength(1);
    expect(notification.showError).toHaveBeenCalledWith('sin conexión');
    expect(draft.submitting()).toBe(false);
  });

  it('debe usar el mensaje por defecto cuando el fallo no trae mensaje', async () => {
    const draft = setup();
    draft.addLine(product('p-1', 180));
    vi.mocked(repo.createOrder).mockReturnValue(throwError(() => new Error('')));

    draft.submitOrder();
    await vi.waitFor(() => expect(draft.error()).toBe('No se pudo registrar el pedido.'));
  });

  it('debe descartar un segundo envío mientras hay uno en curso', async () => {
    const draft = setup();
    draft.addLine(product('p-1', 180));
    const pending = new Subject<VendorOrder>();
    vi.mocked(repo.createOrder).mockReturnValue(pending.asObservable());

    draft.submitOrder();
    draft.submitOrder();

    expect(repo.createOrder).toHaveBeenCalledTimes(1);

    pending.next(order);
    pending.complete();
    await vi.waitFor(() => expect(draft.lastCreatedOrder()).toEqual(order));
  });
});
