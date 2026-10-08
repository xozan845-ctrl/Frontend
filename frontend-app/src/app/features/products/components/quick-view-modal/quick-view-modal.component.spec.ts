import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CartFlyService } from '../../../../shared/ui/cart-fly/cart-fly.service';
import { Product } from '../../models/product.model';
import { QuickViewModalComponent } from './quick-view-modal.component';

const product: Product = {
  id: 9,
  name: 'Monitor Quantum',
  description: 'Monitor 4K de 32 pulgadas',
  price: 500,
  imageUrl: '/monitor.jpg',
  category: 'Monitores',
  stock: 4,
};

describe('QuickViewModalComponent', () => {
  let fixture: ComponentFixture<QuickViewModalComponent>;
  const cartFly = { fly: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [QuickViewModalComponent],
      providers: [provideRouter([]), { provide: CartFlyService, useValue: cartFly }],
    }).compileComponents();
    fixture = TestBed.createComponent(QuickViewModalComponent);
    fixture.componentRef.setInput('product', product);
    fixture.componentRef.setInput('isInWishlist', false);
    fixture.componentRef.setInput('avgRating', 4.5);
    fixture.componentRef.setInput('reviewCount', 12);
    fixture.detectChanges();
  });

  it('debe renderizar los datos del producto en un diálogo accesible', () => {
    const dialog = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;

    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-label')).toContain(product.name);
    expect(dialog.textContent).toContain(product.description);
    expect(dialog.textContent).toContain('C$500.00');
  });

  it('debe emitir cierre al pulsar el botón de cerrar', () => {
    const closed = vi.fn();
    fixture.componentInstance.closeModal.subscribe(closed);

    fixture.nativeElement.querySelector('[aria-label="Cerrar vista rápida"]').click();

    expect(closed).toHaveBeenCalledOnce();
  });

  it('debe emitir cierre al pulsar Escape', () => {
    const closed = vi.fn();
    fixture.componentInstance.closeModal.subscribe(closed);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(closed).toHaveBeenCalledOnce();
  });

  it('debe emitir el producto al añadirlo al carrito', () => {
    const added = vi.fn();
    fixture.componentInstance.addToCart.subscribe(added);
    const button = fixture.nativeElement.querySelector(
      'button:not([aria-label])',
    ) as HTMLButtonElement;

    button.click();

    expect(added).toHaveBeenCalledWith(product);
    expect(cartFly.fly).toHaveBeenCalledWith(button, product.imageUrl);
  });

  it('debe emitir el producto al cambiar favoritos', () => {
    const toggled = vi.fn();
    fixture.componentInstance.toggleWishlist.subscribe(toggled);

    fixture.nativeElement
      .querySelector('[aria-label="Añadir a favoritos"]')
      .dispatchEvent(new Event('click'));

    expect(toggled).toHaveBeenCalledWith(product);
  });
});
