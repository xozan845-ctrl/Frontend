import { Component, computed, input, output, signal } from '@angular/core';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  templateUrl: './star-rating.component.html',
})
export class StarRatingComponent {
  value = input<number>(0);
  interactive = input<boolean>(false);
  size = input<'sm' | 'md' | 'lg'>('md');
  reviewCount = input<number>(0);
  showCount = input<boolean>(false);

  valueChange = output<number>();

  hoveredRating = signal(0);
  starsArray = [1, 2, 3, 4, 5];

  displayRating = computed(() => this.hoveredRating() || this.value());

  onSelect(rating: number): void {
    if (this.interactive()) {
      this.valueChange.emit(rating);
    }
  }
}
