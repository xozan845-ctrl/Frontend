import { Component, OnDestroy, computed, effect, inject, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthStore } from '../../../auth/public-api';
import { StoreWizardStore } from '../../state/store-wizard.store';
import { CatalogProductOption, OfferDraft, WIZARD_STEPS } from '../../models/store-wizard.model';
import { CreateStoreStepperComponent } from '../../components/create-store-stepper/create-store-stepper.component';
import { EmptyStateComponent } from '../../../../shared/ui/empty-state/empty-state.component';
import { SkeletonLoaderComponent } from '../../../../shared/ui/skeleton/skeleton-loader.component';
import { SeoService } from '../../../../core/services/seo.service';

type ProductRow = FormGroup<{
  productId: FormControl<string>;
  selected: FormControl<boolean>;
  margin: FormControl<number>;
}>;

/**
 * Asistente para crear la tienda del vendedor, en 4 pasos: cuenta → tienda →
 * productos → listo (R-AR-12). Contenedor: orquesta el `StoreWizardStore` y el
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
export default class CreateStoreComponent implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  readonly wizard = inject(StoreWizardStore);
  readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly seoService = inject(SeoService);

  readonly steps = WIZARD_STEPS;
  readonly step = this.wizard.step;
  readonly showPassword = signal(false);

  /** Sesión actual: de vendedor (puede crear tienda) o de comprador (no). */
  readonly isSeller = computed(() => this.authStore.user()?.role === 'vendedor');
  readonly isBuyer = computed(() => this.authStore.isAuthenticated() && !this.isSeller());

  // Paso 1 — cuenta de vendedor
  readonly accountForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  // Paso 2 — datos de la tienda
  readonly storeForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    description: [''],
  });

  // Paso 3 — productos a ofertar (margen por producto, 0–90)
  readonly productRows = this.fb.array<ProductRow>([]);
  /** Señal de apoyo para derivar `hasSelection` de un `FormArray` (R-PF-4/R-ST-3). */
  private readonly selectionRevision = signal(0);
  readonly hasSelection = computed(() => {
    this.selectionRevision();
    return this.productRows.controls.some((row) => row.controls.selected.value);
  });

  constructor() {
    this.seoService.setPage(
      'Crear mi tienda',
      'Abre tu tienda en minutos: crea tu cuenta de vendedor, describe tu tienda y publica tus productos.',
    );

    // Con sesión de vendedor, avanza automáticamente del paso de cuenta.
    effect(() => {
      this.wizard.startForSeller(this.isSeller());
    });

    // Prepara el formulario de productos cuando llega el catálogo (estado de UI).
    effect(() => {
      const catalog = this.wizard.catalog();
      if (this.wizard.step() === 3 && catalog.length > 0 && this.productRows.length === 0) {
        this.buildProductRows(catalog);
      }
    });
  }

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

  // ── Paso 2: tienda ─────────────────────────────────────────────────────────
  createStore(): void {
    if (this.storeForm.invalid || this.wizard.loading()) {
      this.storeForm.markAllAsTouched();
      return;
    }
    const { name, description } = this.storeForm.getRawValue();
    this.wizard.createStore({ name, description });
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
    const offers: OfferDraft[] = this.productRows.controls
      .filter((row) => row.controls.selected.value && row.controls.margin.valid)
      .map((row) => ({
        productId: row.controls.productId.value,
        margin: row.controls.margin.value,
      }));

    this.wizard.publishOffers(offers);
  }

  skipProducts(): void {
    this.wizard.publishOffers([]);
  }

  // ── Paso 4: listo ──────────────────────────────────────────────────────────
  goToStore(): void {
    const store = this.wizard.store();
    if (store) this.router.navigate(['/tienda', store.id, 'shop']);
  }

  // ── Utilidades de plantilla ────────────────────────────────────────────────
  invalid(form: FormGroup, field: string): boolean {
    const control = form.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  ngOnDestroy(): void {
    this.seoService.reset();
  }
}
