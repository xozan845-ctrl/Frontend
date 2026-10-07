import { Component, DestroyRef, inject, OnInit, signal, effect, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { ProductStore } from '../../state/product.store';
import { CartStore } from '../../../cart/state/cart.store';
import { WishlistStore } from '../../../wishlist/state/wishlist.store';
import { ReviewsStore } from '../../state/reviews.store';
import { ProductCardComponent } from '../product-card/product-card.component';
import { SkeletonLoaderComponent } from '../../../../shared/ui/skeleton/skeleton-loader.component';
import { SearchAutocompleteComponent } from '../search-autocomplete/search-autocomplete.component';
import { QuickViewModalComponent } from '../quick-view-modal/quick-view-modal.component';
import { EmptyStateComponent } from '../../../../shared/ui/empty-state/empty-state.component';
import { ScrollRevealDirective } from '../../../../shared/directives/scroll-reveal.directive';
import { SeoService } from '../../../../shared/services/seo.service';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    ProductCardComponent,
    SkeletonLoaderComponent,
    SearchAutocompleteComponent,
    QuickViewModalComponent,
    EmptyStateComponent,
    ScrollRevealDirective,
  ],
  templateUrl: './product-list.component.html',
})
export class ProductListComponent implements OnInit {
  readonly productStore = inject(ProductStore);
  readonly cartStore = inject(CartStore);
  private readonly wishlistStore = inject(WishlistStore);
  private readonly reviewsStore = inject(ReviewsStore);
  private readonly route = inject(ActivatedRoute);
  private readonly seoService = inject(SeoService);
  private readonly destroyRef = inject(DestroyRef);

  // Delegar señales computadas y de estado a ProductStore
  readonly categories = this.productStore.categories;
  readonly selectedCategory = this.productStore.selectedCategory;
  readonly sortOption = this.productStore.sortOption;
  readonly priceMin = this.productStore.priceMin;
  readonly priceMax = this.productStore.priceMax;
  readonly currentPage = this.productStore.currentPage;
  readonly filteredProducts = this.productStore.filteredProducts;
  readonly paginatedProducts = this.productStore.paginatedProducts;
  readonly totalPages = this.productStore.totalPages;

  quickViewProduct = signal<Product | null>(null);

  /** Datos que consumen las piezas presentacionales (R-SO-6). */
  readonly cardVms = computed(() => this.paginatedProducts().map((p) => this.toCard(p)));

  readonly quickViewVm = computed(() => {
    const product = this.quickViewProduct();
    return product ? this.toCard(product) : null;
  });

  private toCard(product: Product) {
    return {
      product,
      isInWishlist: this.wishlistStore.isInWishlist(product.id),
      avgRating: this.reviewsStore.getAverageRating(product.id),
      reviewCount: this.reviewsStore.getReviewsByProductId(product.id).length,
    };
  }

  onToggleWishlist(product: Product) {
    this.wishlistStore.toggle(product);
  }

  sortOptions = [
    { value: 'default', label: 'Relevancia' },
    { value: 'price-asc', label: 'Precio: Menor a Mayor' },
    { value: 'price-desc', label: 'Precio: Mayor a Menor' },
    { value: 'name-asc', label: 'Nombre: A - Z' },
    { value: 'name-desc', label: 'Nombre: Z - A' },
  ];

  constructor() {
    // Reset pagination and update SEO when category changes
    effect(() => {
      const cat = this.selectedCategory();
      this.seoService.updateTitle(cat === 'All' ? 'Catálogo de Productos' : `${cat} — Catálogo`);
    });
  }

  ngOnInit() {
    this.seoService.setPage(
      'Catálogo de Productos',
      'Explora todo nuestro catálogo editorial de tecnología.',
    );
    if (this.productStore.products().length === 0) {
      this.productStore.loadProducts();
    }
    // Support ?cat= query param from search autocomplete
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      if (params['cat']) {
        const cat = params['cat'];
        const matched = this.categories().find((c) => c.toLowerCase() === cat.toLowerCase());
        if (matched) this.productStore.setSelectedCategory(matched);
      }
    });
  }

  onCategoryChange(cat: string) {
    this.productStore.setSelectedCategory(cat);
  }

  onSortChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.productStore.setSortOption(value);
  }

  onPriceInput(type: 'min' | 'max', event: Event) {
    const value = (event.target as HTMLInputElement).value;
    const num = value ? parseFloat(value) : null;
    if (type === 'min') this.productStore.setPriceMin(num);
    else this.productStore.setPriceMax(num);
  }

  addToCart(product: Product) {
    this.cartStore.addItem(product);
  }

  openQuickView(product: Product) {
    this.quickViewProduct.set(product);
  }

  retryLoad() {
    this.productStore.loadProducts();
  }

  clearFilters() {
    this.productStore.clearFilters();
  }

  goToPage(page: number) {
    this.productStore.setPage(page);
    window.scrollTo({ top: 120, behavior: 'smooth' });
  }

  readonly pageNumbers = computed<number[]>(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 3) pages.push(-1); // ellipsis

      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);
      for (let i = start; i <= end; i++) pages.push(i);

      if (current < total - 2) pages.push(-1); // ellipsis
      pages.push(total);
    }
    return pages;
  });
}
export default ProductListComponent;
