import { Component, inject, computed, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Product, ProductStore, ReviewsStore } from '../../../products/public-api';
import { ProductCardComponent } from '../../../products/public-ui';
import { CartStore } from '../../../cart/public-api';
import { WishlistStore } from '../../../wishlist/public-api';
import { SkeletonLoaderComponent } from '../../../../shared/ui/skeleton/skeleton-loader.component';
import { EmptyStateComponent } from '../../../../shared/ui/empty-state/empty-state.component';
import { ScrollRevealDirective } from '../../../../shared/directives/scroll-reveal.directive';
import { SeoService } from '../../../../core/services/seo.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    RouterLink,
    ProductCardComponent,
    SkeletonLoaderComponent,
    ScrollRevealDirective,
    EmptyStateComponent,
  ],
  templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit {
  readonly productStore = inject(ProductStore);
  readonly cartStore = inject(CartStore);
  private readonly wishlistStore = inject(WishlistStore);
  private readonly reviewsStore = inject(ReviewsStore);
  private readonly seoService = inject(SeoService);

  featuredProducts = computed(() => this.productStore.products().slice(0, 4));

  /** Tienda activa (de la URL) para enlaces store-scoped. */
  readonly storeId = computed(() => this.productStore.storeId() ?? '');

  /** Datos que consume la tarjeta presentacional (R-SO-6). */
  readonly featuredCards = computed(() => this.featuredProducts().map((p) => this.toCard(p)));

  private toCard(product: Product) {
    return {
      product,
      isInWishlist: this.wishlistStore.isInWishlist(product.id),
      avgRating: this.reviewsStore.getAverageRating(product.id),
      reviewCount: this.reviewsStore.getReviewsByProductId(product.id).length,
    };
  }

  ngOnInit() {
    this.seoService.setPage(
      'Inicio',
      'Hardware premium y tecnología sin concesiones para profesionales.',
    );
    // El storefront lo carga `storefrontResolver` antes de activar la ruta.
  }

  onAddToCart(product: Product) {
    this.cartStore.addItem(product);
  }

  onToggleWishlist(product: Product) {
    this.wishlistStore.toggle(product);
  }

  retryLoad() {
    this.productStore.reload();
  }
}
export default HomeComponent;
