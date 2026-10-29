import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FocusTrapDirective } from '../../../../../shared/directives/focus-trap.directive';
import {
  PURCHASE_COST_TYPES,
  PURCHASE_PAYMENT_METHODS,
  purchaseToday,
  type CreateDirectPurchaseInput,
  type PurchaseCostType,
  type PurchasePaymentMethod,
  type Supplier,
} from '../../../../domains/purchases/public-api';

/** Gasto de contado que no afecta inventario (compra directa). */
@Component({
  selector: 'app-purchase-direct-modal',
  standalone: true,
  imports: [ReactiveFormsModule, FocusTrapDirective],
  templateUrl: './purchase-direct-modal.component.html',
})
export class PurchaseDirectModalComponent {
  readonly open = input.required<boolean>();
  readonly suppliers = input.required<readonly Supplier[]>();
  readonly error = input<string | null>(null);

  readonly dismiss = output<void>();
  readonly save = output<CreateDirectPurchaseInput>();
  readonly createSupplier = output<string>();

  readonly costTypes = PURCHASE_COST_TYPES;
  readonly paymentMethods = PURCHASE_PAYMENT_METHODS;
  readonly showSupplierForm = signal(false);
  readonly manualSupplierName = signal('');
  readonly showRetention = signal(false);

  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.nonNullable.group({
    supplierId: [''],
    concept: ['', [Validators.required, Validators.maxLength(160)]],
    costType: ['inventario' as PurchaseCostType, Validators.required],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    date: [purchaseToday(), Validators.required],
    paymentMethod: ['efectivo' as PurchasePaymentMethod, Validators.required],
    retentionPercent: [0, [Validators.min(0), Validators.max(30)]],
    notes: ['', Validators.maxLength(240)],
  });

  private readonly resetOnOpen = effect(() => {
    if (!this.open()) return;
    this.form.reset({
      supplierId: '',
      concept: '',
      costType: 'inventario',
      amount: 0,
      date: purchaseToday(),
      paymentMethod: 'efectivo',
      retentionPercent: 0,
      notes: '',
    });
    this.showSupplierForm.set(false);
    this.manualSupplierName.set('');
    this.showRetention.set(false);
  });

  toggleSupplierForm(): void {
    this.showSupplierForm.update((value) => !value);
  }

  onManualSupplier(event: Event): void {
    this.manualSupplierName.set((event.target as HTMLInputElement).value);
  }

  addSupplier(): void {
    const name = this.manualSupplierName().trim();
    if (!name) return;
    this.createSupplier.emit(name);
    this.showSupplierForm.set(false);
  }

  toggleRetention(): void {
    this.showRetention.update((value) => !value);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const suppliers = this.suppliers();
    const selected = suppliers.find((supplier) => supplier.id === value.supplierId);
    const supplierName = selected?.name ?? this.manualSupplierName().trim();
    const retention = this.showRetention()
      ? Math.round(value.amount * (value.retentionPercent / 100) * 100) / 100
      : 0;
    this.save.emit({
      date: value.date,
      supplierId: selected?.id ?? null,
      supplierName,
      concept: value.concept.trim(),
      costType: value.costType,
      amount: Number(value.amount),
      paymentMethod: value.paymentMethod,
      notes: value.notes.trim(),
      retention,
    });
  }
}
