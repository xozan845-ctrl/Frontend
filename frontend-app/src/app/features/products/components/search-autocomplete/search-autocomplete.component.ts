import {
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  OnDestroy,
  signal,
  ViewChild,
} from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { ProductStore } from '../../state/product.store';
import { PRODUCT_CATEGORIES } from '../../constants/categories.constants';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { AppCurrencyPipe } from '../../../../shared/pipes/app-currency.pipe';

/** Fragmento de texto para resaltar sin concatenar HTML (R-SE-3). */
interface HighlightPart {
  value: string;
  matched: boolean;
}

@Component({
  selector: 'app-search-autocomplete',
  standalone: true,
  imports: [RouterLink, AppCurrencyPipe],
  templateUrl: './search-autocomplete.component.html',
  styleUrl: './search-autocomplete.component.css',
})
export class SearchAutocompleteComponent implements OnDestroy {
  @ViewChild('searchInput') searchInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('container') containerRef!: ElementRef<HTMLElement>;

  private readonly productStore = inject(ProductStore);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  searchTerm = signal('');
  isOpen = signal(false);
  focusedIndex = signal(-1);

  private readonly allCategories = PRODUCT_CATEGORIES;

  matchedProducts = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (term.length < 2) return [];
    return this.productStore
      .products()
      .filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.description.toLowerCase().includes(term) ||
          p.category.toLowerCase().includes(term),
      )
      .slice(0, 6);
  });

  matchedCategories = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (term.length < 2) return [];
    const dynamicCats = Array.from(
      new Set(
        this.productStore
          .products()
          .map((p) => p.category)
          .filter(Boolean),
      ),
    );
    const pool = dynamicCats.length > 0 ? dynamicCats : [...PRODUCT_CATEGORIES];
    return pool.filter((c) => c.toLowerCase().includes(term));
  });

  /**
   * Productos con su nombre ya troceado en fragmentos resaltables.
   * Evita `[innerHTML]`: el resaltado se interpola en la plantilla (R-SE-3).
   */
  highlightedProducts = computed(() =>
    this.matchedProducts().map((product) => ({
      product,
      parts: this.splitHighlight(product.name),
    })),
  );

  private searchSubject = new Subject<string>();

  constructor() {
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((term) => {
        this.searchTerm.set(term);
        this.isOpen.set(term.length >= 2);
        this.focusedIndex.set(-1);
      });
  }

  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchSubject.next(value);
    if (value.length === 0) this.searchTerm.set('');
  }

  onFocus(): void {
    if (this.searchTerm().length >= 2) this.isOpen.set(true);
  }

  clear(): void {
    this.searchTerm.set('');
    this.isOpen.set(false);
    if (this.searchInputRef) this.searchInputRef.nativeElement.value = '';
    this.searchInputRef?.nativeElement.focus();
  }

  close(): void {
    this.isOpen.set(false);
    this.focusedIndex.set(-1);
  }

  selectCategory(cat: string): void {
    this.router.navigate(['/shop'], { queryParams: { cat } });
    this.close();
  }

  /** Divide el texto en fragmentos, marcando las coincidencias con el término. */
  private splitHighlight(text: string): HighlightPart[] {
    const term = this.searchTerm().trim();
    if (!term) return [{ value: text, matched: false }];

    const regex = new RegExp(`(${this.escapeRegExp(term)})`, 'gi');
    const parts: HighlightPart[] = [];
    let lastIndex = 0;

    for (const match of text.matchAll(regex)) {
      const index = match.index ?? 0;
      if (index > lastIndex) parts.push({ value: text.slice(lastIndex, index), matched: false });
      parts.push({ value: match[0], matched: true });
      lastIndex = index + match[0].length;
    }

    if (lastIndex < text.length) parts.push({ value: text.slice(lastIndex), matched: false });
    return parts.length > 0 ? parts : [{ value: text, matched: false }];
  }

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  onKeydown(event: KeyboardEvent): void {
    const products = this.matchedProducts();
    if (!this.isOpen() || products.length === 0) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.focusedIndex.update((i) => Math.min(i + 1, products.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.focusedIndex.update((i) => Math.max(i - 1, -1));
        break;
      case 'Enter':
        if (this.focusedIndex() >= 0) {
          const selected = products[this.focusedIndex()];
          this.router.navigate(['/product', selected.id]);
          this.close();
        }
        break;
      case 'Escape':
        this.close();
        break;
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.containerRef && !this.containerRef.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
