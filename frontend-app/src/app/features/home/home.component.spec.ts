import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Product } from '../products/public-api';
import { ProductStore } from '../products/public-api';
import { CartStore } from '../cart/public-api';
import { WishlistStore } from '../wishlist/public-api';
import { ReviewsStore } from '../products/public-api';
import { SeoService } from '../../shared/services/seo.service';
import { NotificationService } from '../../shared/ui/notification/notification.service';
import { CartFlyService } from '../../shared/ui/cart-fly/cart-fly.service';
import { HomeComponent } from './home.component';

const products: Product[] = [
  {
    id: 1,
    name: 'Teclado Quantum',
    description: 'Mecánico RGB',
    price: 80,
    imageUrl: '/keyboard.jpg',
    category: 'Periféricos',
    stock: 5,
  },
  {
    id: 2,
    name: 'Monitor Quantum',
    description: 'Monitor 4K',
    price: 500,
    imageUrl: '/monitor.jpg',
    category: 'Monitores',
    stock: 0,
  },
];

class IntersectionObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

describe('HomeComponent', () => {
  const productList = signal(products);
  const productStore = {
    products: productList,
    loading: signal(false),
    error: signal<string | null>(null),
    loadProducts: vi.fn(),
  };
  const cartStore = { addItem: vi.fn() };
  const wishlistStore = { isInWishlist: vi.fn(() => false), toggle: vi.fn() };
  const reviewsStore = {
    getAverageRating: vi.fn(() => 4),
    getReviewsByProductId: vi.fn(() => []),
  };
  const seo = { setPage: vi.fn(), reset: vi.fn() };
  const notification = { showSuccess: vi.fn() };
  const cartFly = { fly: vi.fn() };

  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideRouter([]),
        { provide: ProductStore, useValue: productStore },
        { provide: CartStore, useValue: cartStore },
        { provide: WishlistStore, useValue: wishlistStore },
        { provide: ReviewsStore, useValue: reviewsStore },
        { provide: SeoService, useValue: seo },
        { provide: NotificationService, useValue: notification },
        { provide: CartFlyService, useValue: cartFly },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    productList.set(products);
    productStore.loading.set(false);
    productStore.error.set(null);
    vi.stubGlobal('IntersectionObserver', IntersectionObserverStub);
  });

  afterEach(() => vi.unstubAllGlobals());

  it('debe derivar un máximo de cuatro productos destacados', async () => {
    const fixture = await setup();

    expect(fixture.componentInstance.featuredCards().map((card) => card.product.id)).toEqual([
      1, 2,
    ]);
    expect(fixture.componentInstance.featuredCards()[0].isInWishlist).toBe(false);
  });

  it('debe solicitar productos al iniciar cuando la lista está vacía', async () => {
    productList.set([]);
    await setup();

    expect(productStore.loadProducts).toHaveBeenCalled();
  });

  it('debe reintentar la carga después de un error', async () => {
    productStore.error.set('fallo de red');
    const fixture = await setup();

    fixture.componentInstance.retryLoad();

    expect(productStore.loadProducts).toHaveBeenCalled();
  });

  it('debe delegar al store al añadir un producto al carrito', async () => {
    const fixture = await setup();

    fixture.componentInstance.onAddToCart(products[0]);

    expect(cartStore.addItem).toHaveBeenCalledWith(products[0]);
  });

  it('debe delegar al store al cambiar favoritos', async () => {
    const fixture = await setup();

    fixture.componentInstance.onToggleWishlist(products[0]);

    expect(wishlistStore.toggle).toHaveBeenCalledWith(products[0]);
  });
});
