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

const cartItems: CartItem[] = [{ product: product(1, 50), quantity: 2 }];

describe('CartStore', () => {
  let repo: CartRepository;
  const notification = { showSuccess: vi.fn(), showError: vi.fn(), showInfo: vi.fn() };

  const setup = (authenticated = true) => {
    repo = {
      getCart: vi.fn(() => of(cartItems)),
      addItem: vi.fn(() => of(cartItems)),
      updateQuantity: vi.fn(() => of(cartItems)),
      removeItem: vi.fn(() => of([])),
      clearCart: vi.fn(() => of([])),
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: CART_REPOSITORY, useValue: repo },
        { provide: AuthStore, useValue: { isAuthenticated: () => authenticated } },
        { provide: NotificationService, useValue: notification },
      ],
    });
    return TestBed.inject(CartStore);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('debe cargar el carrito del servidor con sesión y calcular totales', async () => {
    const store = setup(true);

    await vi.waitFor(() => expect(store.items()).toHaveLength(1));
    expect(repo.getCart).toHaveBeenCalled();
    expect(store.totalItems()).toBe(2);
    expect(store.totalPrice()).toBe(100);
  });

  it('no debe cargar el carrito sin sesión', () => {
    const store = setup(false);

    expect(store.items()).toEqual([]);
    expect(repo.getCart).not.toHaveBeenCalled();
  });

  it('debe delegar addItem al repositorio', () => {
    const store = setup(true);
    const item: CartItem[] = [{ product: product(1, 50), quantity: 3 }];
    vi.mocked(repo.addItem).mockReturnValue(of(item));

    store.addItem(product(1, 50), 2);

    expect(repo.addItem).toHaveBeenCalledWith('1', 2);
    expect(store.items()).toEqual(item);
  });

  it('debe delegar updateQuantity al repositorio', () => {
    const store = setup(true);
    vi.mocked(repo.updateQuantity).mockReturnValue(of([{ product: product(1), quantity: 5 }]));

    store.updateQuantity('1', 5);

    expect(repo.updateQuantity).toHaveBeenCalledWith('1', 5);
    expect(store.totalItems()).toBe(5);
  });

  it('debe delegar removeItem al repositorio y notificar', () => {
    const store = setup(true);

    store.removeItem('1');

    expect(repo.removeItem).toHaveBeenCalledWith('1');
    expect(notification.showSuccess).toHaveBeenCalled();
    expect(store.items()).toEqual([]);
  });

  it('debe vaciar el carrito en el servidor', () => {
    const store = setup(true);

    store.clearCart();

    expect(repo.clearCart).toHaveBeenCalled();
    expect(store.items()).toEqual([]);
  });

  it('debe limpiar el estado local con reset sin llamar al backend', () => {
    const store = setup(true);
    vi.mocked(repo.clearCart).mockClear();

    store.reset();

    expect(store.items()).toEqual([]);
    expect(repo.clearCart).not.toHaveBeenCalled();
  });

  it('debe registrar el error del carrito', () => {
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
        { provide: AuthStore, useValue: { isAuthenticated: () => true } },
        { provide: NotificationService, useValue: notification },
      ],
    });
    const store = TestBed.inject(CartStore);

    store.loadCart();

    expect(store.error()).toBe('boom');
    expect(notification.showError).toHaveBeenCalled();
  });

  it('debe alternar el sidebar y aceptar un valor explícito', () => {
    const store = setup(true);

    store.toggleSidebar();
    expect(store.isSidebarOpen()).toBe(true);

    store.toggleSidebar(false);
    expect(store.isSidebarOpen()).toBe(false);
  });
});
