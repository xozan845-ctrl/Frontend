import { Component, computed, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FocusTrapDirective } from '../../../../../shared/directives/focus-trap.directive';
import type { CatalogProduct } from '../../../../applications/products/public-api';
import type {
  CompanyCatalogStatus,
  CompanyPromotion,
  CompanyPromotionFormValue,
  CompanyPromotionType,
} from '../../../../applications/empresas/public-api';

/** Modal de alta/edición de promociones (R-PS-04). */
@Component({
  selector: 'app-company-promotion-modal',
  standalone: true,
  imports: [ReactiveFormsModule, FocusTrapDirective],
  templateUrl: './company-promotion-modal.component.html',
})
export class CompanyPromotionModalComponent {
  readonly open = input(false);
  readonly mode = input<'create' | 'edit'>('create');
  readonly item = input<CompanyPromotion | null>(null);
  readonly products = input<readonly CatalogProduct[]>([]);
  readonly saving = input(false);
  readonly error = input<string | null>(null);

  readonly save = output<CompanyPromotionFormValue>();
  readonly dismiss = output<void>();

  private readonly fb = inject(FormBuilder);
  readonly isEdit = computed(() => this.mode() === 'edit');

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    type: ['2x1' as CompanyPromotionType, [Validators.required]],
    productId: [''],
    sku: [''],
    requiredQuantity: ['', [Validators.pattern(/^\d*$/)]],
    freeQuantity: ['', [Validators.pattern(/^\d*$/)]],
    discountPercentage: ['', [Validators.pattern(/^\d{0,3}$/)]],
    from: ['', [Validators.required]],
    to: ['', [Validators.required]],
    status: ['activo' as CompanyCatalogStatus],
  });

  private readonly syncForm = effect(() => {
    if (!this.open()) return;
    const item = this.item();
    this.form.reset({
      name: item?.name ?? '',
      type: item?.type ?? '2x1',
      productId: item?.productId ?? '',
      sku: item?.sku ?? '',
      requiredQuantity:
        item?.requiredQuantity === null || item?.requiredQuantity === undefined
          ? ''
          : String(item.requiredQuantity),
      freeQuantity:
        item?.freeQuantity === null || item?.freeQuantity === undefined
          ? ''
          : String(item.freeQuantity),
      discountPercentage:
        item?.discountPercentage === null || item?.discountPercentage === undefined
          ? ''
          : String(item.discountPercentage),
      from: item?.from ?? new Date().toISOString().slice(0, 10),
      to: item?.to ?? new Date().toISOString().slice(0, 10),
      status: item?.status ?? 'activo',
    });
  });

  isType(type: CompanyPromotionType): boolean {
    return this.form.controls.type.value === type;
  }

  selectProduct(productId: string): void {
    const product = this.products().find((candidate) => candidate.id === productId);
    this.form.controls.productId.setValue(product?.id ?? '');
    this.form.controls.sku.setValue(product?.sku ?? '');
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
    const type = raw.type;
    this.save.emit({
      name: raw.name.trim(),
      type,
      productId: raw.productId.trim(),
      sku: raw.sku.trim(),
      requiredQuantity:
        type === 'descuento_cantidad' || type === 'regalo'
          ? Number(raw.requiredQuantity) || null
          : null,
      freeQuantity:
        type === 'descuento_cantidad' || type === 'regalo'
          ? Number(raw.freeQuantity) || null
          : null,
      discountPercentage:
        type === 'descuento_porcentaje' ? Number(raw.discountPercentage) || null : null,
      from: raw.from,
      to: raw.to,
      status: raw.status,
    });
  }
}
