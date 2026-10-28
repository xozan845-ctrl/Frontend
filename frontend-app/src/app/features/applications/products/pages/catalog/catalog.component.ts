import { Component, DestroyRef, effect, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SeoService } from '../../../../../core/services/seo/seo.service';
import { AppCurrencyPipe } from '../../../../../shared/pipes/app-currency.pipe';
import { SkeletonLoaderComponent } from '../../../../../shared/ui/skeleton/skeleton-loader.component';
import { AuthStore } from '../../../auth/public-api';
import { CatalogProduct, CatalogProductStatus } from '../../models/catalog-product.model';
import { CatalogProductsStore } from '../../state/catalog-product/catalog-product.store';

/**
 * Catálogo maestro (ADR-32): listado público con filtros/paginación y CRUD del
 * empresario. La página orquesta el `CatalogProductsStore`; el HTTP vive en el
 * servicio (`R-CX-3`, `R-AR-8`).
 */
@Component({
  selector: 'app-catalog-page',
  standalone: true,
  imports: [ReactiveFormsModule, AppCurrencyPipe, SkeletonLoaderComponent],
  templateUrl: './catalog.component.html',
})
export default class CatalogComponent {
  /**
   * Cuando el catálogo se embebe en otra página (p. ej. el apartado
   * "Productos / Servicios" de empresa), oculta la miga de pan y usa `h2` para
   * no duplicar el `h1`; el SEO lo gestiona la página contenedora.
   */
  readonly embedded = input(false);
  readonly catalog = inject(CatalogProductsStore);
  readonly authStore = inject(AuthStore);
  private readonly fb = inject(FormBuilder);
  private readonly seoService = inject(SeoService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly syncSeo = effect(() => {
    if (!this.embedded()) {
      this.seoService.setPage(
        'Catálogo — Panel del vendedor',
        'Consulta el catálogo maestro, filtra productos y administra su stock y precio base.',
      );
    }
  });
  /** En modo embebido el SEO pertenece a la página contenedora. */
  private readonly cleanupSeo = this.destroyRef.onDestroy(() => {
    if (!this.embedded()) this.seoService.reset();
  });

  readonly canManage = () => this.authStore.user()?.role === 'empresario';
  readonly showForm = signal(false);
  readonly editing = signal<CatalogProduct | null>(null);
  readonly filterQuery = signal('');
  readonly filterCategory = signal('');
  readonly filterStatus = signal<CatalogProductStatus | null>(null);

  readonly productForm = this.fb.nonNullable.group({
    sku: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9-]{2,32}$/)]],
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
    description: [''],
    category: [''],
    basePrice: ['', [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
    stock: [0, [Validators.required, Validators.min(0)]],
  });

  private readonly loadCatalog = this.catalog.load();

  /** Cierra el formulario cuando el store confirma el guardado. */
  private readonly closeAfterSave = effect(() => {
    if (this.catalog.lastSaved()) {
      this.catalog.acknowledgeSaved();
      this.closeForm();
    }
  });

  openCreate(): void {
    this.editing.set(null);
    this.productForm.reset({
      sku: '',
      name: '',
      description: '',
      category: '',
      basePrice: '',
      stock: 0,
    });
    this.productForm.controls.sku.enable();
    this.showForm.set(true);
  }

  openEdit(product: CatalogProduct): void {
    this.editing.set(product);
    this.productForm.reset({
      sku: product.sku,
      name: product.name,
      description: product.description,
      category: product.category,
      basePrice: product.basePrice.toFixed(2),
      stock: product.stock,
    });
    this.productForm.controls.sku.disable();
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editing.set(null);
  }

  submit(): void {
    if (this.productForm.invalid || this.catalog.saving()) {
      this.productForm.markAllAsTouched();
      return;
    }

    const { sku, name, description, category, basePrice, stock } = this.productForm.getRawValue();
    const editing = this.editing();

    if (editing) {
      this.catalog.update({
        id: editing.id,
        data: {
          name,
          description,
          category,
          basePrice,
          stock,
        },
      });
      return;
    }

    this.catalog.create({ sku, name, description, category, basePrice, stock });
  }

  applyFilters(): void {
    this.catalog.applyFilters({
      query: this.filterQuery(),
      status: this.filterStatus(),
      category: this.filterCategory(),
    });
  }

  clearFilters(): void {
    this.filterQuery.set('');
    this.filterCategory.set('');
    this.filterStatus.set(null);
    this.applyFilters();
  }

  onStatusChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.filterStatus.set(value === 'disponible' || value === 'agotado' ? value : null);
  }

  isInvalid(field: string): boolean {
    const control = this.productForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
