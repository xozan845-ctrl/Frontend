import { Component, computed, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AppCurrencyPipe } from '@shared/pipes/app-currency.pipe';
import {
  PURCHASE_PAYMENT_METHODS,
  type CreateNewProductPurchaseInput,
  type PurchasePaymentMethod,
  type Supplier,
  purchaseToday,
} from '@domains/purchases/public-api';

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Formulario de alta de producto nuevo desde una compra. */
@Component({
  selector: 'app-purchase-new-product-form',
  standalone: true,
  imports: [ReactiveFormsModule, AppCurrencyPipe],
  templateUrl: './purchase-new-product-form.component.html',
})
export default class PurchaseNewProductFormComponent {
  readonly suppliers = input.required<readonly Supplier[]>();
  readonly submitNewProduct = output<CreateNewProductPurchaseInput>();
  readonly dismiss = output<void>();

  readonly paymentMethods = PURCHASE_PAYMENT_METHODS;
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.nonNullable.group({
    supplierId: [''],
    name: ['', [Validators.required, Validators.maxLength(140)]],
    category: ['', Validators.maxLength(80)],
    sku: ['', Validators.maxLength(60)],
    paymentMethod: ['efectivo' as PurchasePaymentMethod, Validators.required],
    unitCost: [0, [Validators.required, Validators.min(0.01)]],
    salePrice: [0, [Validators.required, Validators.min(0.01)]],
    quantity: [1, [Validators.required, Validators.min(1)]],
  });

  readonly total = computed(() => {
    const value = this.form.value;
    return round2(Number(value.unitCost) * Number(value.quantity));
  });

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const supplier = this.suppliers().find((item) => item.id === value.supplierId);
    this.submitNewProduct.emit({
      date: purchaseToday(),
      supplierId: supplier?.id ?? null,
      supplierName: supplier?.name ?? '',
      productName: value.name.trim(),
      category: value.category.trim(),
      sku: value.sku.trim(),
      paymentMethod: value.paymentMethod,
      unitCost: Number(value.unitCost),
      salePrice: Number(value.salePrice),
      quantity: Math.max(1, Math.trunc(Number(value.quantity))),
    });
  }
}
