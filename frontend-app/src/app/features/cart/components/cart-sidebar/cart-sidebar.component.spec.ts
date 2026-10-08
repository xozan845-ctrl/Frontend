import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { CartStore } from '../../state/cart.store';
import { Product } from '../../../products/models/product.model';
import { CartSidebarComponent } from './cart-sidebar.component';

const product: Product = {
  id: 4,
  name: 'Mouse',
  description: 'Inalámbrico',
  price: 50,
  imageUrl: '/mouse.jpg',
  category: 'Periféricos',
  stock: 4,
};

describe('CartSidebarComponent', () => {
  let fixture: ComponentFixture<CartSidebarComponent>;
  const cartStore = {
    isSidebarOpen: () => true,
    items: () => [{ product, quantity: 2 }],
    totalPrice: () => 100,
    toggleSidebar: vi.fn(),
    updateQuantity: vi.fn(),
    removeItem: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [CartSidebarComponent],
      providers: [provideRouter([]), { provide: CartStore, useValue: cartStore }],
    }).compileComponents();
    fixture = TestBed.createComponent(CartSidebarComponent);
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
    fixture.nativeElement.querySelector('[aria-label="Cerrar"]').click();

    expect(cartStore.toggleSidebar).toHaveBeenCalledWith(false);
  });

  it('debe navegar a checkout al procesar la orden', () => {
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const host = fixture.nativeElement as HTMLElement;
    const button = Array.from(host.querySelectorAll<HTMLButtonElement>('button')).find((item) =>
      item.textContent?.includes('Procesar Orden'),
    )!;

    button.click();

    expect(cartStore.toggleSidebar).toHaveBeenCalledWith(false);
    expect(navigate).toHaveBeenCalledWith(['/checkout']);
  });
});
