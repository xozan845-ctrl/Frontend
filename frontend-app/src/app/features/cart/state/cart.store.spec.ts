import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { CartStore } from './cart.store';
import { CartItem } from '../models/cart.model';
import { Product } from '../../products/models/product.model';
import { CART_REPOSITORY, CartRepository } from '../repositories/cart.repository';
import { AuthStore } from '../../auth/public-api';
import { NotificationService } from '../../../core/services/notification.service';

const product = (id: number, price = 100): Product => ({
  id: String(id),
  name: `Producto ${id}`,
  description: '',
  price,
  imageUrl: '',
  category: 'General',
  stock: 10,
});

const serverItems: CartItem[] = [{ product: product(1, 50), quantity: 2 }];
const STORAGE_KEY = 'ecom_cart_items';

describe('CartStore', () => {
  let repo: CartRepository;
  let authenticated: boolean;
  const notification = { showSuccess: vi.fn(), showError: vi.fn(), showInfo: vi.fn() };

  const setup = () => {
    repo = {
      getCart: vi.fn(() => of(serverItems)),
      addItem: vi.fn(() => of(serverItems)),
      updateQuantity: vi.fn(() => of(serverItems)),
      removeItem: vi.fn(() => of([])),
      clearCart: vi.fn(() => of([])),
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: CART_REPOSITORY, useValue: repo },
        {
          provide: AuthStore,
          useValue: {
            isAuthenticated: () => authenticated,
            user: () =>
              authenticated ? { id: 1, email: 'a@a.com', name: 'A', role: 'comprador' } : null,
          },
        },
        { provide: NotificationService, useValue: notification },
      ],
    });
    return TestBed.inject(CartStore);
  };

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    authenticated = false;
    TestBed.resetTestingModule();
  });

  afterEach(() => localStorage.clear());

  // ── Invitado (carrito local) ────────────────────────────────────────────────
  it('invitado: addItem es local, persiste y muestra el mensaje para registrarse', () => {
    const store = setup();

    store.addItem(product(1, 50), 2);

    expect(store.items()).toHaveLength(1);
    expect(store.totalItems()).toBe(2);
    expect(store.totalPrice()).toBe(100);
    expect(repo.addItem).not.toHaveBeenCalled();
    expect(notification.showInfo).toHaveBeenCalled();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')).toHaveLength(1);
  });

  it('invitado: carga el carrito local al iniciar', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([{ product: product(9), quantity: 3 }]));

    const store = setup();

    await vi.waitFor(() => expect(store.totalItems()).toBe(3));
  });

  it('invitado: updateQuantity y removeItem son locales', () => {
    const store = setup();
    store.addItem(product(1), 1);

    store.updateQuantity('1', 5);
    expect(store.totalItems()).toBe(5);

    store.removeItem('1');
    expect(store.items()).toEqual([]);
    expect(repo.updateQuantity).not.toHaveBeenCalled();
  });

  // ── Autenticado (carrito del servidor) ──────────────────────────────────────
  it('con sesión: addItem delega al servidor', () => {
    authenticated = true;
    const store = setup();

    store.addItem(product(1, 50), 2);

    expect(repo.addItem).toHaveBeenCalledWith('1', 2);
    expect(store.items()).toEqual(serverItems);
  });

  it('con sesión: loadCart usa el servidor', () => {
    authenticated = true;
    const store = setup();
    vi.mocked(repo.getCart).mockClear();

    store.loadCart();

    expect(repo.getCart).toHaveBeenCalled();
    expect(store.totalItems()).toBe(2);
  });

  it('con sesión: updateQuantity/removeItem/clearCart delegan al servidor', () => {
    authenticated = true;
    const store = setup();

    store.updateQuantity('1', 3);
    expect(repo.updateQuantity).toHaveBeenCalledWith('1', 3);

    store.removeItem('1');
    expect(repo.removeItem).toHaveBeenCalledWith('1');

    store.clearCart();
    expect(repo.clearCart).toHaveBeenCalled();
  });

  it('vuelca el carrito local al servidor (mergeLocalCart)', () => {
    authenticated = true;
    const store = setup();
    const local: CartItem[] = [
      { product: product(5, 10), quantity: 1 },
      { product: product(6, 20), quantity: 2 },
    ];

    store.mergeLocalCart(local);

    expect(repo.addItem).toHaveBeenCalledTimes(2);
    expect(repo.getCart).toHaveBeenCalled();
    expect(notification.showSuccess).toHaveBeenCalled();
  });

  it('mergeLocalCart sin items solo carga el servidor', () => {
    authenticated = true;
    const store = setup();

    store.mergeLocalCart([]);

    expect(repo.addItem).not.toHaveBeenCalled();
    expect(repo.getCart).toHaveBeenCalled();
  });

  it('reset limpia estado y almacenamiento local', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([{ product: product(1), quantity: 1 }]));
    const store = setup();

    store.reset();

    expect(store.items()).toEqual([]);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('debe registrar el error del carrito', () => {
    authenticated = true;
    repo = {
      getCart: vi.fn(() => throwError(() => new Error('boom'))),
      addItem: vi.fn(() => of([])),
      updateQuantity: vi.fn(() => of([])),
      removeItem: vi.fn(() => of([])),
      clearCart: vi.fn(() => of([])),
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: CART_REPOSITORY, useValue: repo },
        {
          provide: AuthStore,
          useValue: {
            isAuthenticated: () => true,
            user: () => ({ id: 1, email: 'a@a.com', name: 'A', role: 'comprador' }),
          },
        },
        { provide: NotificationService, useValue: notification },
      ],
    });
    const store = TestBed.inject(CartStore);

    store.loadCart();

    expect(store.error()).toBe('boom');
    expect(notification.showError).toHaveBeenCalled();
  });

  it('debe alternar el sidebar y aceptar un valor explícito', () => {
    const store = setup();

    store.toggleSidebar();
    expect(store.isSidebarOpen()).toBe(true);

    store.toggleSidebar(false);
    expect(store.isSidebarOpen()).toBe(false);
  });
});
