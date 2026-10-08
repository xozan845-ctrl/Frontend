import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { CartStore } from '../../state/cart.store';
import { Product } from '../../../products/models/product.model';
import { CartViewComponent } from './cart-view.component';

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
  const cartStore = {
    items,
    totalItems: () => items().reduce((count, item) => count + item.quantity, 0),
    totalPrice: () =>
      items().reduce((total, item) => total + item.product.price * item.quantity, 0),
    updateQuantity: vi.fn(),
    removeItem: vi.fn(),
    clearCart: vi.fn(() => items.set([])),
  };

  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [CartViewComponent],
      providers: [provideRouter([]), { provide: CartStore, useValue: cartStore }],
    }).compileComponents();
    const fixture = TestBed.createComponent(CartViewComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    items.set([{ product, quantity: 2 }]);
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

    expect(navigate).toHaveBeenCalledWith(['/checkout']);
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
});
