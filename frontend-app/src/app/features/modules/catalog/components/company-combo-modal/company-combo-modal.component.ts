import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FocusTrapDirective } from '../../../../../shared/directives/focus-trap.directive';
import type { CatalogProduct } from '../../../../applications/products/public-api';
import type {
  CompanyCatalogStatus,
  CompanyCombo,
  CompanyComboComponentFormValue,
  CompanyComboFormValue,
} from '../../../../applications/empresas/public-api';

/** Modal de alta/edición de combos (R-PS-04). */
@Component({
  selector: 'app-company-combo-modal',
  standalone: true,
  imports: [ReactiveFormsModule, FocusTrapDirective],
  templateUrl: './company-combo-modal.component.html',
})
export class CompanyComboModalComponent {
  readonly open = input(false);
  readonly mode = input<'create' | 'edit'>('create');
  readonly item = input<CompanyCombo | null>(null);
  readonly products = input<readonly CatalogProduct[]>([]);
  readonly saving = input(false);
  readonly error = input<string | null>(null);

  readonly save = output<CompanyComboFormValue>();
  readonly dismiss = output<void>();

  private readonly fb = inject(FormBuilder);
  readonly isEdit = computed(() => this.mode() === 'edit');
  readonly components = signal<CompanyComboComponentFormValue[]>([]);

  readonly form = this.fb.nonNullable.group({
    sku: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9-]{2,32}$/)]],
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
    description: ['', [Validators.maxLength(500)]],
    barcode: ['', [Validators.maxLength(64)]],
    price: ['', [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
    status: ['activo' as CompanyCatalogStatus],
  });

  private readonly syncForm = effect(() => {
    if (!this.open()) return;
    const item = this.item();
    this.form.reset({
      sku: item?.sku ?? '',
      name: item?.name ?? '',
      description: item?.description ?? '',
      barcode: item?.barcode ?? '',
      price: item ? item.price.toFixed(2) : '',
      status: item?.status ?? 'activo',
    });
    if (this.isEdit()) this.form.controls.sku.disable();
    else this.form.controls.sku.enable();
    this.components.set(
      item
        ? item.components.map((component) => ({
            productId: component.productId,
            sku: component.sku,
            name: component.name,
            quantity: component.quantity,
          }))
        : [{ productId: '', sku: '', name: '', quantity: 1 }],
    );
  });

  addComponent(): void {
    this.components.update((components) => [
      ...components,
      { productId: '', sku: '', name: '', quantity: 1 },
    ]);
  }

  removeComponent(index: number): void {
    this.components.update((components) => components.filter((_, position) => position !== index));
  }

  selectProduct(index: number, productId: string): void {
    const product = this.products().find((candidate) => candidate.id === productId);
    this.components.update((components) =>
      components.map((component, position) =>
        position === index
          ? {
              ...component,
              productId: product?.id ?? '',
              sku: product?.sku ?? '',
              name: product?.name ?? '',
            }
          : component,
      ),
    );
  }

  setQuantity(index: number, value: string): void {
    const quantity = Math.max(1, Math.trunc(Number(value) || 1));
    this.components.update((components) =>
      components.map((component, position) =>
        position === index ? { ...component, quantity } : component,
      ),
    );
  }

  close(): void {
    if (this.saving()) return;
    this.dismiss.emit();
  }

  submit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    this.save.emit({
      sku: raw.sku.trim(),
      name: raw.name.trim(),
      description: raw.description.trim(),
      barcode: raw.barcode.trim(),
      price: raw.price.trim(),
      status: raw.status,
      components: this.components().filter((component) => component.sku.trim()),
    });
  }
}
