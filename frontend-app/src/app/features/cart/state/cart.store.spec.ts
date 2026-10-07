import { TestBed } from '@angular/core/testing';
import { CartStore } from './cart.store';
import { Product } from '../../products/models/product.model';
import { AVAILABLE_COUPONS } from '../constants/coupons.constants';

const product = (id: number, price = 100): Product => ({
  id,
  name: `Producto ${id}`,
  description: '',
  price,
  imageUrl: `https://img/${id}.png`,
  category: 'General',
  stock: 10,
});

describe('CartStore', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  afterEach(() => localStorage.clear());

  it('debe iniciar con el carrito vacío', () => {
    const store = TestBed.inject(CartStore);

    expect(store.items()).toEqual([]);
    expect(store.totalItems()).toBe(0);
    expect(store.totalPrice()).toBe(0);
    expect(store.finalPrice()).toBe(0);
  });

  it('debe agregar un producto y calcular los totales', () => {
    const store = TestBed.inject(CartStore);

    store.addItem(product(1, 50), 2);

    expect(store.items()).toHaveLength(1);
    expect(store.totalItems()).toBe(2);
    expect(store.totalPrice()).toBe(100);
  });

  it('debe incrementar la cantidad al agregar el mismo producto', () => {
    const store = TestBed.inject(CartStore);

    store.addItem(product(1), 1);
    store.addItem(product(1), 3);

    expect(store.items()).toHaveLength(1);
    expect(store.totalItems()).toBe(4);
  });

  it('debe actualizar la cantidad de un producto', () => {
    const store = TestBed.inject(CartStore);
    store.addItem(product(1), 1);

    store.updateQuantity(1, 5);

    expect(store.totalItems()).toBe(5);
  });

  it('debe eliminar el producto cuando la cantidad queda en cero o menos', () => {
    const store = TestBed.inject(CartStore);
    store.addItem(product(1), 2);

    store.updateQuantity(1, 0);

    expect(store.items()).toEqual([]);
  });

  it('debe eliminar un producto por id', () => {
    const store = TestBed.inject(CartStore);
    store.addItem(product(1), 1);
    store.addItem(product(2), 1);

    store.removeItem(1);

    expect(store.items().map((item) => item.product.id)).toEqual([2]);
  });

  it('debe aplicar un cupón válido y calcular descuento y precio final', () => {
    const store = TestBed.inject(CartStore);
    store.addItem(product(1, 100), 1);

    store.applyCoupon(AVAILABLE_COUPONS['DESCUENTO10'].code);

    expect(store.appliedCoupon()).toBe('DESCUENTO10');
    expect(store.discountPercentage()).toBe(10);
    expect(store.discountAmount()).toBe(10);
    expect(store.finalPrice()).toBe(90);
  });

  it('debe ignorar un cupón inválido', () => {
    const store = TestBed.inject(CartStore);

    store.applyCoupon('NO-EXISTE');

    expect(store.appliedCoupon()).toBeNull();
    expect(store.discountPercentage()).toBe(0);
  });

  it('debe quitar el cupón aplicado', () => {
    const store = TestBed.inject(CartStore);
    store.applyCoupon('PROMO20');

    store.removeCoupon();

    expect(store.appliedCoupon()).toBeNull();
    expect(store.discountPercentage()).toBe(0);
  });

  it('debe limpiar el carrito y el cupón', () => {
    const store = TestBed.inject(CartStore);
    store.addItem(product(1), 2);
    store.applyCoupon('PROMO20');

    store.clearCart();

    expect(store.items()).toEqual([]);
    expect(store.appliedCoupon()).toBeNull();
  });

  it('debe alternar el sidebar y aceptar un valor explícito', () => {
    const store = TestBed.inject(CartStore);

    store.toggleSidebar();
    expect(store.isSidebarOpen()).toBe(true);

    store.toggleSidebar(false);
    expect(store.isSidebarOpen()).toBe(false);
  });

  it('debe persistir los items en localStorage', async () => {
    const store = TestBed.inject(CartStore);

    store.addItem(product(1), 2);

    await vi.waitFor(() => {
      const stored = JSON.parse(localStorage.getItem('ecom_cart_items') ?? '[]');
      expect(stored).toHaveLength(1);
    });
  });

  it('debe cargar los items desde localStorage al iniciar', () => {
    localStorage.setItem('ecom_cart_items', JSON.stringify([{ product: product(9), quantity: 3 }]));

    const store = TestBed.inject(CartStore);

    expect(store.items()).toHaveLength(1);
    expect(store.totalItems()).toBe(3);
  });
});
