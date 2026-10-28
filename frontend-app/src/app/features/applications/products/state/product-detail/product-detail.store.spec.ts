import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Product } from '../../models/product.model';
import { ProductStore } from '../product/product.store';
import { RecentlyViewedStore } from '../recently-viewed/recently-viewed.store';
import { ReviewsStore } from '../reviews/reviews.store';
import { WishlistStore } from '../../../wishlist/state/wishlist/wishlist.store';
import { ProductDetailStore } from './product-detail.store';

const product: Product = {
  id: 9,
  name: 'Monitor Quantum',
  description: 'Monitor 4K de 32 pulgadas.',
  price: 500,
  originalPrice: 600,
  imageUrl: '/monitor.jpg',
  category: 'Monitores',
  stock: 4,
};

describe('ProductDetailStore', () => {
  const selectedProduct = signal<Product | null>(product);
  const recentlyViewed = signal<Product[]>([
    product,
    { ...product, id: 10, name: 'Teclado Quantum' },
  ]);
  const productStore = { selectedProduct };
  const reviewsStore = {
    getReviewsByProductId: vi.fn(() => [
      {
        id: 'r-1',
        productId: product.id,
        authorName: 'Ana',
        rating: 5,
        comment: 'Excelente',
        date: '2026-10-01T10:00:00Z',
      },
    ]),
    getAverageRating: vi.fn(() => 4.5),
  };
  const wishlistStore = { isInWishlist: vi.fn(() => true) };
  const recentlyViewedStore = { products: recentlyViewed };

  const setup = () => {
    TestBed.configureTestingModule({
      providers: [
        ProductDetailStore,
        { provide: ProductStore, useValue: productStore },
        { provide: ReviewsStore, useValue: reviewsStore },
        { provide: RecentlyViewedStore, useValue: recentlyViewedStore },
        { provide: WishlistStore, useValue: wishlistStore },
      ],
    });
    return TestBed.inject(ProductDetailStore);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    selectedProduct.set(product);
    recentlyViewed.set([product, { ...product, id: 10, name: 'Teclado Quantum' }]);
    TestBed.resetTestingModule();
  });

  it('deriva reseñas, rating, wishlist, recientes y descuento del producto', () => {
    const store = setup();

    expect(store.productReviews()).toHaveLength(1);
    expect(store.productReviews()[0].formattedDate).toBeTruthy();
    expect(store.avgRating()).toBe(4.5);
    expect(store.isInWishlist()).toBe(true);
    expect(store.recentlyViewedOtherProducts().map((item) => item.id)).toEqual([10]);
    expect(store.discountPercent()).toBe(17);
  });

  it('no deriva datos si no hay producto seleccionado', () => {
    selectedProduct.set(null);
    const store = setup();

    expect(store.productReviews()).toEqual([]);
    expect(store.avgRating()).toBe(0);
    expect(store.isInWishlist()).toBe(false);
    expect(store.discountPercent()).toBeNull();
  });

  it('no inventa un descuento si no hay precio original mayor', () => {
    selectedProduct.set({ ...product, originalPrice: product.price });
    const store = setup();

    expect(store.discountPercent()).toBeNull();
  });
});
