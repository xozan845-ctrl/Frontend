import { Component, computed, effect, inject, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthStore } from '../../../auth/public-api';
import { StoreWizardStore } from '../../state/store-wizard/store-wizard.store';
import {
  CatalogProductOption,
  CreateStoreProductDraft,
  OfferDraft,
  StoreCompanyMode,
  WIZARD_STEPS,
} from '../../models/store-wizard.model';
import { CreateStoreStepperComponent } from '../../components/create-store-stepper/create-store-stepper.component';
import { EmptyStateComponent } from '../../../../../shared/ui/empty-state/empty-state.component';
import { SkeletonLoaderComponent } from '../../../../../shared/ui/skeleton/skeleton-loader.component';
import { injectSeoPage } from '../../../../../core/services/seo/seo.service';
import type { NewProductRow, ProductRow } from './create-store.types';

const MIN_INITIAL_PRODUCTS = 5;

/**
 * Asistente para crear una empresa y su primera tienda, en 4 pasos: cuenta →
 * negocio → productos → listo (R-AR-12). Contenedor: orquesta el `StoreWizardStore` y el
 * `AuthStore`; el indicador de pasos es presentacional (R-SO-8).
 */
@Component({
  selector: 'app-create-store',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    CreateStoreStepperComponent,
    EmptyStateComponent,
    SkeletonLoaderComponent,
    NgClass,
  ],
  templateUrl: './create-store.component.html',
})
export default class CreateStoreComponent {
  private readonly fb = inject(FormBuilder);
  readonly wizard = inject(StoreWizardStore);
  readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly seoService = injectSeoPage(
    'Crear empresa',
    'Crea tu empresa y su primera tienda: configura el negocio y publica tus productos.',
  );

  readonly steps = WIZARD_STEPS;
  readonly step = this.wizard.step;
  readonly showPassword = signal(false);

  /** Sesión actual: de vendedor/empresario (puede crear tienda) o de comprador (no). */
  readonly isSeller = this.authStore.isSeller;
  readonly isBuyer = computed(() => this.authStore.isAuthenticated() && !this.isSeller());
  readonly isCompanyOwner = this.authStore.isCompanyOwner;
  readonly minimumProducts = MIN_INITIAL_PRODUCTS;
  /** El JWT ya trae la empresa activa; si no, el onboarding la crea antes de la tienda. */
  readonly hasCompany = computed(() => !!this.authStore.user()?.tenantId);
  readonly needsCompany = computed(() => this.isSeller() && !this.hasCompany());

  // Paso 1 — cuenta de empresario
  readonly accountForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  // Paso 2 — empresa (si falta) y datos de la tienda
  readonly storeForm = this.fb.nonNullable.group({
    companyName: [''],
    logisticsMode: this.fb.nonNullable.control<StoreCompanyMode>('plataforma'),
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    description: [''],
  });

  // Paso 3 — productos a ofertar (margen por producto, 0–90)
  readonly productRows = this.fb.array<ProductRow>([]);
  readonly newProductRows = this.fb.array<NewProductRow>(
    Array.from({ length: MIN_INITIAL_PRODUCTS }, () => this.createNewProductRow()),
  );
  /** Señal de apoyo para derivar `hasSelection` de un `FormArray` (R-PF-4/R-ST-3). */
  private readonly selectionRevision = signal(0);
  readonly selectedProductCount = computed(() => {
    this.selectionRevision();
    return this.productRows.controls.filter((row) => row.controls.selected.value).length;
  });
  readonly hasMinimumProducts = computed(() => this.selectedProductCount() >= this.minimumProducts);
  readonly hasSelection = computed(() => {
    return this.selectedProductCount() > 0;
  });

  /** Con sesión de vendedor, avanza automáticamente del paso de cuenta. */
  private readonly syncSellerStep = effect(() => {
    this.wizard.startForSeller(this.isSeller());
  });

  /** Prepara el formulario de productos cuando llega el catálogo (estado de UI). */
  private readonly prepareProductRows = effect(() => {
    const catalog = this.wizard.catalog();
    if (this.wizard.step() === 3 && catalog.length > 0 && this.productRows.length === 0) {
      this.buildProductRows(catalog);
    }
  });

  private redirectedToWorkspace = false;
  /** Al completar el onboarding, el propietario continúa trabajando en su workspace. */
  private readonly redirectCompanyOwner = effect(() => {
    const completed = this.wizard.step() === 4 && !!this.wizard.store();
    if (!completed || !this.isCompanyOwner() || this.redirectedToWorkspace) return;

    this.redirectedToWorkspace = true;
    void this.router.navigateByUrl('/empresa/inicio');
  });

  // ── Paso 1: cuenta ─────────────────────────────────────────────────────────
  register(): void {
    if (this.accountForm.invalid || this.authStore.loading()) {
      this.accountForm.markAllAsTouched();
      return;
    }
    const { name, email, password } = this.accountForm.getRawValue();
    this.authStore.register({ name, email, password, role: 'seller' });
  }

  logout(): void {
    this.authStore.clearSession();
  }

  // ── Paso 2: empresa y tienda ───────────────────────────────────────────────
  createStore(): void {
    if (this.storeForm.invalid || this.wizard.loading()) {
      this.storeForm.markAllAsTouched();
      return;
    }
    const { name, description, companyName, logisticsMode } = this.storeForm.getRawValue();
    const company = this.needsCompany()
      ? { name: companyName.trim() || name, logisticsMode }
      : undefined;
    this.wizard.createStore({ name, description, ...(company ? { company } : {}) });
  }

  // ── Paso 3: productos ──────────────────────────────────────────────────────
  private buildProductRows(catalog: CatalogProductOption[]): void {
    for (const option of catalog) {
      this.productRows.push(
        this.fb.group({
          productId: this.fb.nonNullable.control(option.id, Validators.required),
          selected: this.fb.nonNullable.control(false),
          margin: this.fb.nonNullable.control(15, [Validators.min(0), Validators.max(90)]),
        }),
      );
    }
  }

  toggleRow(index: number): void {
    const row = this.productRows.at(index);
    row.controls.selected.setValue(!row.controls.selected.value);
    this.selectionRevision.update((v) => v + 1);
  }

  /** Reintenta cargar el catálogo tras un error (R-UX-1); flecha para el `input` de `EmptyState`. */
  readonly retryCatalog = (): void => {
    this.wizard.loadCatalog();
  };

  publish(): void {
    if (this.isCompanyOwner()) {
      if (this.newProductRows.invalid) {
        this.newProductRows.markAllAsTouched();
        return;
      }

      const drafts: CreateStoreProductDraft[] = this.newProductRows.getRawValue();
      this.wizard.createAndPublishProducts(drafts);
      return;
    }

    if (!this.hasMinimumProducts()) return;

    const offers: OfferDraft[] = this.productRows.controls
      .filter((row) => row.controls.selected.value && row.controls.margin.valid)
      .map((row) => ({
        productId: row.controls.productId.value,
        margin: row.controls.margin.value,
      }));

    this.wizard.publishOffers(offers);
  }

  private createNewProductRow(): NewProductRow {
    return this.fb.group({
      sku: this.fb.nonNullable.control('', [
        Validators.required,
        Validators.pattern(/^[A-Za-z0-9-]{2,32}$/),
      ]),
      name: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(2)]),
      description: this.fb.nonNullable.control(''),
      category: this.fb.nonNullable.control(''),
      basePrice: this.fb.nonNullable.control('', [
        Validators.required,
        Validators.pattern(/^\d+(\.\d{1,2})?$/),
      ]),
      stock: this.fb.nonNullable.control(0, [Validators.required, Validators.min(0)]),
      margin: this.fb.nonNullable.control(15, [Validators.min(0), Validators.max(90)]),
    });
  }

  skipProducts(): void {
    this.wizard.publishOffers([]);
  }

  // ── Paso 4: listo ──────────────────────────────────────────────────────────
  goToStore(): void {
    const store = this.wizard.store();
    if (store) this.router.navigate(['/tienda', store.id, 'shop']);
  }

  goToWorkspace(): void {
    void this.router.navigateByUrl('/empresa/inicio');
  }

  // ── Utilidades de plantilla ────────────────────────────────────────────────
  invalid(form: FormGroup, field: string): boolean {
    const control = form.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
