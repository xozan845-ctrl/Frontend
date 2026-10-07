import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { AuthStore } from '../../../auth/state/auth.store';
import { CartStore } from '../../../cart/state/cart.store';
import { NotificationService } from '../../../../shared/ui/notification/notification.service';
import { SeoService } from '../../../../shared/services/seo.service';
import { CartFlyService } from '../../../../shared/ui/cart-fly/cart-fly.service';
import { ProductStore } from '../../state/product.store';
import { ReviewsStore } from '../../state/reviews.store';
import { RecentlyViewedStore } from '../../state/recently-viewed.store';
import { WishlistStore } from '../../../wishlist/state/wishlist.store';
import { Product } from '../../models/product.model';
import { ProductDetailComponent } from './product-detail.component';

const product: Product = {
  id: 9,
  name: 'Monitor Quantum',
  description: 'Monitor 4K de 32 pulgadas para trabajo y entretenimiento.',
  price: 500,
  originalPrice: 600,
  imageUrl: '/monitor.jpg',
  images: ['/monitor.jpg', '/monitor-lateral.jpg'],
  category: 'Monitores',
  stock: 4,
  variants: { colors: [{ name: 'Negro', hex: '#000000' }], specs: ['4K'] },
};

describe('ProductDetailComponent', () => {
  const selectedProduct = signal<Product | null>(product);
  const recentlyViewedProducts = signal<Product[]>([]);
  const productStore = {
    selectedProduct,
    loading: signal(false),
    error: signal<string | null>(null),
    loadProductById: vi.fn(),
    clearSelectedProduct: vi.fn(() => selectedProduct.set(null)),
  };
  const cartStore = { addItem: vi.fn() };
  const reviewsStore = {
    getReviewsByProductId: vi.fn(() => []),
    getAverageRating: vi.fn(() => 4.5),
    addReview: vi.fn(),
  };
  const recentlyViewedStore = {
    products: recentlyViewedProducts,
    addProduct: vi.fn(),
  };
  const wishlistStore = { isInWishlist: vi.fn(() => false), toggle: vi.fn() };
  const notification = { showSuccess: vi.fn(), showInfo: vi.fn(), showError: vi.fn() };
  const cartFly = { fly: vi.fn() };
  const seo = { setProductPage: vi.fn(), reset: vi.fn() };

  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [ProductDetailComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => '9' } } },
        },
        { provide: ProductStore, useValue: productStore },
        { provide: CartStore, useValue: cartStore },
        { provide: ReviewsStore, useValue: reviewsStore },
        { provide: RecentlyViewedStore, useValue: recentlyViewedStore },
        { provide: WishlistStore, useValue: wishlistStore },
        { provide: NotificationService, useValue: notification },
        { provide: CartFlyService, useValue: cartFly },
        { provide: SeoService, useValue: seo },
        { provide: AuthStore, useValue: { isAuthenticated: () => false } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(ProductDetailComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    selectedProduct.set(product);
    recentlyViewedProducts.set([]);
  });

  it('debe solicitar el producto de la ruta y mostrar sus datos', async () => {
    const fixture = await setup();

    expect(productStore.loadProductById).toHaveBeenCalledWith(9);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(product.name);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('-17%');
  });

  it('debe limitar la cantidad entre uno y noventa y nueve', async () => {
    const fixture = await setup();
    const component = fixture.componentInstance;

    component.updateQuantity(-1);
    expect(component.quantity()).toBe(1);

    component.quantity.set(98);
    component.updateQuantity(1);
    expect(component.quantity()).toBe(99);
    component.updateQuantity(1);
    expect(component.quantity()).toBe(99);
  });

  it('debe agregar al carrito el producto con la cantidad seleccionada', async () => {
    const fixture = await setup();
    fixture.componentInstance.quantity.set(3);

    fixture.componentInstance.addToCart(document.createElement('button'));

    expect(cartStore.addItem).toHaveBeenCalledWith(product, 3);
    expect(notification.showSuccess).toHaveBeenCalled();
  });

  it('no debe publicar una reseña inválida', async () => {
    const fixture = await setup();
    const component = fixture.componentInstance;
    component.showReviewForm.set(true);
    component.submitReview();

    expect(component.reviewSubmitted()).toBe(true);
    expect(reviewsStore.addReview).not.toHaveBeenCalled();
  });

  it('debe publicar la reseña válida y limpiar el formulario', async () => {
    const fixture = await setup();
    const component = fixture.componentInstance;
    component.reviewForm.setValue({ authorName: 'Ana', comment: 'Excelente monitor 4K.' });
    component.selectedRating.set(5);

    component.submitReview();

    expect(reviewsStore.addReview).toHaveBeenCalledWith({
      productId: product.id,
      authorName: 'Ana',
      rating: 5,
      comment: 'Excelente monitor 4K.',
    });
    expect(component.showReviewForm()).toBe(false);
    expect(component.selectedRating()).toBe(0);
  });
});
