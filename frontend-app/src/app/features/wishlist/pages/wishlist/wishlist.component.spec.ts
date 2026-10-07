import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CartStore } from '../../../cart/state/cart.store';
import { ReviewsStore } from '../../../products/state/reviews.store';
import { SeoService } from '../../../../core/services/seo.service';
import { Product } from '../../../products/models/product.model';
import { WishlistComponent } from './wishlist.component';
import { WishlistStore } from '../../state/wishlist.store';

const product: Product = {
  id: 12,
  name: 'Teclado Quantum',
  description: 'Mecánico RGB',
  price: 120,
  imageUrl: '/keyboard.jpg',
  category: 'Periféricos',
  stock: 5,
};

describe('WishlistComponent', () => {
  const items = signal<Product[]>([product]);
  const wishlistStore = {
    items,
    totalItems: () => items().length,
    isInWishlist: vi.fn(() => true),
    toggle: vi.fn(),
    removeItem: vi.fn((id: string | number) =>
      items.update((current) => current.filter((item) => item.id !== id)),
    ),
  };
  const cartStore = { addItem: vi.fn() };
  const reviewsStore = {
    getAverageRating: vi.fn(() => 4.5),
    getReviewsByProductId: vi.fn(() => [{ id: 1 }]),
  };
  const seo = { setPage: vi.fn(), reset: vi.fn() };

  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [WishlistComponent],
      providers: [
        provideRouter([]),
        { provide: WishlistStore, useValue: wishlistStore },
        { provide: CartStore, useValue: cartStore },
        { provide: ReviewsStore, useValue: reviewsStore },
        { provide: SeoService, useValue: seo },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(WishlistComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    items.set([product]);
  });

  it('debe mostrar productos favoritos y su calificación', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.textContent).toContain(product.name);
    expect(fixture.componentInstance.wishlistVms()[0]).toMatchObject({
      product,
      avgRating: 4.5,
      reviewCount: 1,
    });
  });

  it('debe quitar el producto seleccionado de favoritos', async () => {
    const fixture = await setup();

    fixture.nativeElement.querySelector('[aria-label="Quitar de favoritos"]').click();

    expect(wishlistStore.removeItem).toHaveBeenCalledWith(product.id);
  });

  it('debe añadir el favorito al carrito', async () => {
    const fixture = await setup();
    const button = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('button'),
    ).find((candidate) => candidate.textContent?.includes('Añadir al Carrito'))!;

    button.click();

    expect(cartStore.addItem).toHaveBeenCalledWith(product);
  });

  it('debe abrir la vista rápida del producto seleccionado', async () => {
    const fixture = await setup();

    fixture.nativeElement.querySelector('[aria-label="Vista rápida"]').click();
    fixture.detectChanges();

    expect(fixture.componentInstance.quickViewProduct()).toEqual(product);
    expect(fixture.nativeElement.querySelector('app-quick-view-modal')).not.toBeNull();
  });

  it('debe quitar todos los productos favoritos', async () => {
    items.set([product, { ...product, id: 13, name: 'Mouse' }]);
    const fixture = await setup();
    const button = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('button'),
    ).find((candidate) => candidate.textContent?.includes('Limpiar Todo'))!;

    button.click();

    expect(wishlistStore.removeItem).toHaveBeenCalledTimes(2);
    expect(items()).toEqual([]);
  });
});
