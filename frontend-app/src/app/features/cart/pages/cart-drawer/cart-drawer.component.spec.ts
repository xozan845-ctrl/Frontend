import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Router, provideRouter } from '@angular/router';
import { CartStore } from '../../state/cart.store';
import { CartUiStore } from '../../state/cart-ui.store';
import { ProductStore } from '../../../products/state/product.store';
import { AuthStore } from '../../../auth/state/auth.store';
import { Product } from '../../../products/models/product.model';
import { CartDrawerComponent } from './cart-drawer.component';

const product: Product = {
  id: 4,
  name: 'Mouse',
  description: 'Inalámbrico',
  price: 50,
  imageUrl: '/mouse.jpg',
  category: 'Periféricos',
  stock: 4,
};

describe('CartDrawerComponent', () => {
  let fixture: ComponentFixture<CartDrawerComponent>;
  const items = signal([{ product, quantity: 2 }]);
  const loading = signal(false);
  const error = signal<string | null>(null);
  const cartStore = {
    items,
    loading,
    error,
    totalPrice: () => 100,
    updateQuantity: vi.fn(),
    removeItem: vi.fn(),
    loadCart: vi.fn(),
  };
  const cartUiStore = { isSidebarOpen: () => true, toggleSidebar: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();
    items.set([{ product, quantity: 2 }]);
    loading.set(false);
    error.set(null);
    await TestBed.configureTestingModule({
      imports: [CartDrawerComponent],
      providers: [
        provideRouter([]),
        { provide: CartStore, useValue: cartStore },
        { provide: CartUiStore, useValue: cartUiStore },
        { provide: ProductStore, useValue: { storeId: () => 'tienda-1' } },
        { provide: AuthStore, useValue: { isAuthenticated: () => false } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(CartDrawerComponent);
    fixture.detectChanges();
  });

  it('debe renderizar el carrito como diálogo con su producto', () => {
    const dialog = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;

    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.textContent).toContain('Mouse');
    expect(dialog.textContent).toContain('C$100.00');
  });

  it('debe incrementar la cantidad del producto', () => {
    fixture.nativeElement.querySelector('[aria-label="Aumentar cantidad"]').click();

    expect(cartStore.updateQuantity).toHaveBeenCalledWith(product.id, 3);
  });

  it('debe reducir la cantidad del producto', () => {
    fixture.nativeElement.querySelector('[aria-label="Disminuir cantidad"]').click();

    expect(cartStore.updateQuantity).toHaveBeenCalledWith(product.id, 1);
  });

  it('debe eliminar el producto del carrito', () => {
    fixture.nativeElement.querySelector('[aria-label="Eliminar producto"]').click();

    expect(cartStore.removeItem).toHaveBeenCalledWith(product.id);
  });

  it('debe cerrar el panel al pulsar cerrar', () => {
    fixture.nativeElement.querySelector('[data-testid="drawer-close"]').click();

    expect(cartUiStore.toggleSidebar).toHaveBeenCalledWith(false);
  });

  it('debe cerrar el panel al pulsar Escape', () => {
    const dialog = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;

    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(cartUiStore.toggleSidebar).toHaveBeenCalledWith(false);
  });

  it('debe mostrar el estado de carga cuando el carrito está cargando y vacío', () => {
    items.set([]);
    loading.set(true);
    fixture.detectChanges();

    expect(
      (fixture.nativeElement as HTMLElement).querySelector('[data-testid="cart-loading"]'),
    ).not.toBeNull();
  });

  it('debe navegar a checkout al procesar la orden', () => {
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const host = fixture.nativeElement as HTMLElement;
    const button = host.querySelector<HTMLButtonElement>('[data-testid="drawer-checkout"]')!;

    button.click();

    expect(cartUiStore.toggleSidebar).toHaveBeenCalledWith(false);
    expect(navigate).toHaveBeenCalledWith(['/tienda', 'tienda-1', 'checkout']);
  });
});
