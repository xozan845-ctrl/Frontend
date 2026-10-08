import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { CartStore } from '../../../cart/state/cart.store';
import { AuthStore } from '../../../auth/state/auth.store';
import { WishlistStore } from '../../../wishlist/state/wishlist.store';
import { ReviewsStore } from '../../state/reviews.store';
import { ProductStore } from '../../state/product.store';
import { SeoService } from '../../../../core/services/seo.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { CartFlyService } from '../../../../shared/ui/cart-fly/cart-fly.service';
import { Product } from '../../models/product.model';
import { ProductListComponent } from './product-list.component';

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

describe('ProductListComponent', () => {
  const loading = signal(false);
  const error = signal<string | null>(null);
  const selectedCategory = signal('All');
  const priceMin = signal<number | null>(null);
  const priceMax = signal<number | null>(null);
  const sortOption = signal('default');
  const currentPage = signal(1);
  const allProducts = signal(products);
  const filteredProducts = computed(() =>
    allProducts().filter((product) => {
      const categoryMatches =
        selectedCategory() === 'All' || product.category === selectedCategory();
      const minMatches = priceMin() === null || product.price >= priceMin()!;
      const maxMatches = priceMax() === null || product.price <= priceMax()!;
      return categoryMatches && minMatches && maxMatches;
    }),
  );
  const productStore = {
    products: allProducts,
    loading,
    error,
    selectedCategory,
    priceMin,
    priceMax,
    sortOption,
    currentPage,
    pageSize: signal(12),
    categories: computed(() => ['All', ...new Set(allProducts().map((item) => item.category))]),
    filteredProducts,
    paginatedProducts: filteredProducts,
    totalPages: signal(1),
    setSelectedCategory: vi.fn((value: string) => selectedCategory.set(value)),
    setPriceMin: vi.fn((value: number | null) => priceMin.set(value)),
    setPriceMax: vi.fn((value: number | null) => priceMax.set(value)),
    setSortOption: vi.fn((value: string) => sortOption.set(value)),
    setPage: vi.fn((value: number) => currentPage.set(value)),
    reload: vi.fn(),
    clearFilters: vi.fn(() => {
      selectedCategory.set('All');
      priceMin.set(null);
      priceMax.set(null);
    }),
  };
  const cartStore = { addItem: vi.fn() };
  const wishlistStore = { isInWishlist: vi.fn(() => false), toggle: vi.fn() };
  const reviewsStore = {
    getAverageRating: vi.fn(() => 4),
    getReviewsByProductId: vi.fn(() => []),
  };
  const seo = { setPage: vi.fn(), updateTitle: vi.fn(), reset: vi.fn() };
  const notification = { showSuccess: vi.fn(), showError: vi.fn(), showInfo: vi.fn() };
  const cartFly = { fly: vi.fn() };

  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [ProductListComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { queryParams: of({}) } },
        { provide: ProductStore, useValue: productStore },
        { provide: CartStore, useValue: cartStore },
        { provide: AuthStore, useValue: { isAuthenticated: () => true } },
        { provide: WishlistStore, useValue: wishlistStore },
        { provide: ReviewsStore, useValue: reviewsStore },
        { provide: SeoService, useValue: seo },
        { provide: NotificationService, useValue: notification },
        { provide: CartFlyService, useValue: cartFly },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(ProductListComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    loading.set(false);
    error.set(null);
    selectedCategory.set('All');
    priceMin.set(null);
    priceMax.set(null);
    sortOption.set('default');
    currentPage.set(1);
    allProducts.set(products);
    vi.stubGlobal('IntersectionObserver', IntersectionObserverStub);
  });

  afterEach(() => vi.unstubAllGlobals());

  it('debe renderizar los productos del catálogo', async () => {
    const fixture = await setup();

    expect(fixture.nativeElement.querySelectorAll('app-product-card').length).toBe(2);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Teclado Quantum');
  });

  it('debe mostrar skeletons mientras carga', async () => {
    loading.set(true);
    const fixture = await setup();

    expect(fixture.nativeElement.querySelector('app-skeleton-loader')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-product-card')).toBeNull();
  });

  it('debe mostrar error y permitir reintentar la carga', async () => {
    error.set('No fue posible cargar el catálogo');
    const fixture = await setup();
    const retry = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('button'),
    ).find((button) => button.textContent?.includes('Reintentar'))!;

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'No fue posible cargar el catálogo',
    );
    retry.click();
    expect(productStore.reload).toHaveBeenCalled();
  });

  it('debe aplicar la categoría elegida', async () => {
    const fixture = await setup();
    const categoryButton = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('button'),
    ).find((button) => button.textContent?.trim() === 'Periféricos')!;

    categoryButton.click();
    fixture.detectChanges();

    expect(productStore.setSelectedCategory).toHaveBeenCalledWith('Periféricos');
    expect(fixture.nativeElement.querySelectorAll('app-product-card').length).toBe(1);
  });

  it('debe aplicar el precio mínimo introducido', async () => {
    const fixture = await setup();
    const input = fixture.nativeElement.querySelector(
      '[aria-label="Precio mínimo"]',
    ) as HTMLInputElement;
    input.value = '100';
    input.dispatchEvent(new Event('input'));

    expect(productStore.setPriceMin).toHaveBeenCalledWith(100);
  });

  it('debe añadir al carrito el producto de la tarjeta', async () => {
    const fixture = await setup();
    const button = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('button'),
    ).find((candidate) => candidate.textContent?.includes('Añadir al Carrito'))!;

    button.click();

    expect(cartStore.addItem).toHaveBeenCalledWith(products[0]);
  });
});
