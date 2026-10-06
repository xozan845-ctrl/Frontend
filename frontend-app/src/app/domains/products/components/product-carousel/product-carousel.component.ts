import { Component, computed, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-product-carousel',
  standalone: true,
  imports: [RouterLink, NgOptimizedImage],
  templateUrl: './product-carousel.component.html',
})
export class ProductCarouselComponent {
  products = input.required<Product[]>();
  title = input('Vistos Recientemente');
  itemsPerPage = input(5);

  currentIndex = signal(0);

  visibleProducts = computed(() => {
    const start = this.currentIndex();
    return this.products().slice(start, start + this.itemsPerPage());
  });

  canGoNext = computed(() => this.currentIndex() + this.itemsPerPage() < this.products().length);

  prev(): void {
    this.currentIndex.update((i) => Math.max(0, i - 1));
  }

  next(): void {
    if (this.canGoNext()) {
      this.currentIndex.update((i) => i + 1);
    }
  }
}
