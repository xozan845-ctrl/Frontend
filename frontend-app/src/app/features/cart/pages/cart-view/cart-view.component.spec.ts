import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { CartStore } from '../../state/cart.store';
import { ProductStore } from '../../../products/state/product.store';
import { AuthStore } from '../../../auth/state/auth.store';
import { Product } from '../../../products/models/product.model';
import { CartViewComponent } from './cart-view.component';
import { SeoService } from '../../../../core/services/seo.service';

const product: Product = {
  id: 21,
  name: 'Auriculares Quantum',
  description: 'Cancelación de ruido',
  price: 150,
  imageUrl: '/headphones.jpg',
  category: 'Audio',
  stock: 7,
};

describe('CartViewComponent', () => {
  const items = signal([{ product, quantity: 2 }]);
  const loading = signal(false);
  const error = signal<string | null>(null);
  const seo = { setPage: vi.fn(), reset: vi.fn() };
  const cartStore = {
    items,
    loading,
    error,
    totalItems: () => items().reduce((count, item) => count + item.quantity, 0),
    totalPrice: () =>
      items().reduce((total, item) => total + item.product.price * item.quantity, 0),
    updateQuantity: vi.fn(),
    removeItem: vi.fn(),
    clearCart: vi.fn(() => items.set([])),
    loadCart: vi.fn(),
  };

  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [CartViewComponent],
      providers: [
        provideRouter([]),
        { provide: CartStore, useValue: cartStore },
        { provide: ProductStore, useValue: { storeId: () => 'tienda-1' } },
        { provide: AuthStore, useValue: { isAuthenticated: () => false } },
        { provide: SeoService, useValue: seo },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(CartViewComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    items.set([{ product, quantity: 2 }]);
    loading.set(false);
    error.set(null);
  });

  it('debe mostrar el producto, cantidad y total del carrito', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.textContent).toContain(product.name);
    expect(host.textContent).toContain('C$300.00');
    expect(host.textContent).toContain('Subtotal (2)');
  });

  it('debe cambiar la cantidad del producto', async () => {
    const fixture = await setup();

    fixture.nativeElement.querySelector('[aria-label="Aumentar cantidad"]').click();

    expect(cartStore.updateQuantity).toHaveBeenCalledWith(product.id, 3);
  });

  it('debe navegar a checkout al procesar la orden', async () => {
    const fixture = await setup();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const button = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('button'),
    ).find((candidate) => candidate.textContent?.includes('Procesar Orden'))!;

    button.click();

    expect(navigate).toHaveBeenCalledWith(['/tienda', 'tienda-1', 'checkout']);
  });

  it('debe mostrar la confirmación antes de vaciar el carrito', async () => {
    const fixture = await setup();
    const clear = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('button'),
    ).find((candidate) => candidate.textContent?.includes('Vaciar carrito'))!;

    clear.click();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('¿Vaciar carrito?');
    expect(cartStore.clearCart).not.toHaveBeenCalled();
  });

  it('debe vaciar el carrito al confirmar', async () => {
    const fixture = await setup();
    const clear = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('button'),
    ).find((candidate) => candidate.textContent?.includes('Vaciar carrito'))!;
    clear.click();
    fixture.detectChanges();
    const confirm = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('button'),
    ).find((candidate) => candidate.textContent?.trim() === 'Vaciar')!;

    confirm.click();
    fixture.detectChanges();

    expect(cartStore.clearCart).toHaveBeenCalledOnce();
    expect(fixture.componentInstance.showClearConfirm()).toBe(false);
  });

  it('debe exponer el modal de vaciado como diálogo accesible', async () => {
    const fixture = await setup();
    const clear = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('button'),
    ).find((candidate) => candidate.textContent?.includes('Vaciar carrito'))!;
    clear.click();
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const dialog = host.querySelector('[role="dialog"]');

    expect(dialog?.getAttribute('aria-modal')).toBe('true');
    expect(dialog?.getAttribute('aria-labelledby')).toBe('clear-cart-title');
    expect(host.querySelector('#clear-cart-title')?.textContent).toContain('¿Vaciar carrito?');
  });

  it('debe cerrar el modal de vaciado al pulsar Escape', async () => {
    const fixture = await setup();
    const clear = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('button'),
    ).find((candidate) => candidate.textContent?.includes('Vaciar carrito'))!;
    clear.click();
    fixture.detectChanges();

    const dialog = (fixture.nativeElement as HTMLElement).querySelector('[role="dialog"]')!;
    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();

    expect(fixture.componentInstance.showClearConfirm()).toBe(false);
    expect(cartStore.clearCart).not.toHaveBeenCalled();
  });

  it('debe mostrar el estado de carga cuando el carrito está cargando y vacío', async () => {
    items.set([]);
    loading.set(true);
    const fixture = await setup();

    expect(
      (fixture.nativeElement as HTMLElement).querySelector('[data-testid="cart-loading"]'),
    ).not.toBeNull();
  });

  it('debe mostrar el estado de error con reintento', async () => {
    items.set([]);
    error.set('No se pudo cargar tu carrito.');
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.textContent).toContain('No pudimos cargar tu carrito');
    const retry = Array.from(host.querySelectorAll<HTMLButtonElement>('button')).find((b) =>
      b.textContent?.includes('Reintentar'),
    );
    retry?.click();

    expect(cartStore.loadCart).toHaveBeenCalled();
  });

  it('debe actualizar el SEO al entrar y restaurarlo al salir', async () => {
    const fixture = await setup();

    expect(seo.setPage).toHaveBeenCalled();
    fixture.destroy();
    expect(seo.reset).toHaveBeenCalled();
  });
});
