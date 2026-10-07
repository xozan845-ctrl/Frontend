import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CartFlyService } from '../../../../shared/ui/cart-fly/cart-fly.service';
import { NotificationService } from '../../../../shared/ui/notification/notification.service';
import { Product } from '../../models/product.model';
import { ProductCardComponent } from './product-card.component';

const product: Product = {
  id: 7,
  name: 'Teclado mecánico',
  description: 'Teclas RGB',
  price: 80,
  originalPrice: 100,
  imageUrl: '/teclado.jpg',
  category: 'Periféricos',
  stock: 3,
};

describe('ProductCardComponent', () => {
  let fixture: ComponentFixture<ProductCardComponent>;
  const notification = { showSuccess: vi.fn() };
  const cartFly = { fly: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [ProductCardComponent],
      providers: [
        provideRouter([]),
        { provide: NotificationService, useValue: notification },
        { provide: CartFlyService, useValue: cartFly },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductCardComponent);
    fixture.componentRef.setInput('product', product);
    fixture.detectChanges();
  });

  it('debe mostrar los datos y el descuento del producto', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('Teclado mecánico');
    expect(element.textContent).toContain('-20% OFF');
    expect(fixture.componentInstance.discountPercent()).toBe(20);
  });

  it('debe emitir el producto al añadirlo al carrito', () => {
    const emitted: Product[] = [];
    fixture.componentInstance.addToCart.subscribe((value) => emitted.push(value));
    const host = fixture.nativeElement as HTMLElement;
    const button = Array.from(host.querySelectorAll<HTMLButtonElement>('button')).find((item) =>
      item.textContent?.includes('Añadir al Carrito'),
    )!;

    button.click();
    fixture.detectChanges();

    expect(emitted).toEqual([product]);
    expect(notification.showSuccess).toHaveBeenCalledWith('Producto añadido al carrito');
    expect(cartFly.fly).toHaveBeenCalledWith(button, product.imageUrl);
  });

  it('debe emitir el producto al cambiar favoritos', () => {
    const emitted: Product[] = [];
    fixture.componentInstance.toggleWishlist.subscribe((value) => emitted.push(value));

    fixture.nativeElement.querySelector('[aria-label="Añadir a favoritos"]').click();

    expect(emitted).toEqual([product]);
  });

  it('debe emitir el producto al abrir la vista rápida', () => {
    const emitted: Product[] = [];
    fixture.componentInstance.quickView.subscribe((value) => emitted.push(value));

    fixture.nativeElement.querySelector('[aria-label="Vista rápida"]').click();

    expect(emitted).toEqual([product]);
  });

  it('debe deshabilitar la acción cuando no hay stock', () => {
    fixture.componentRef.setInput('product', { ...product, stock: 0 });
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;

    expect(fixture.nativeElement.textContent).toContain('Agotado');
    expect(
      Array.from(host.querySelectorAll<HTMLButtonElement>('button')).some((button) =>
        button.textContent?.includes('Añadir al Carrito'),
      ),
    ).toBe(false);
  });
});
