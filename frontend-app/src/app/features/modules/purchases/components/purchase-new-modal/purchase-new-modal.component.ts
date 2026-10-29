import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FocusTrapDirective } from '../../../../../shared/directives/focus-trap.directive';
import { AppCurrencyPipe } from '../../../../../shared/pipes/app-currency.pipe';
import {
  PURCHASE_PAYMENT_METHODS,
  purchaseToday,
  type CreateNewProductPurchaseInput,
  type CreateOrderInput,
  type CreatePurchaseInput,
  type PurchaseLineInput,
  type PurchasePaymentMethod,
  type PurchaseProductOption,
  type PurchaseStatus,
  type Supplier,
} from '../../../../domains/purchases/public-api';
import type { WizardMode, WizardStage, WizardStep } from './purchase-new-modal.types';

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Asistente de nueva compra / nueva orden y alta de producto nuevo. */
@Component({
  selector: 'app-purchase-new-modal',
  standalone: true,
  imports: [ReactiveFormsModule, FocusTrapDirective, AppCurrencyPipe],
  templateUrl: './purchase-new-modal.component.html',
})
export class PurchaseNewModalComponent {
  readonly open = input.required<boolean>();
  readonly mode = input<WizardMode>('compra');
  readonly products = input.required<readonly PurchaseProductOption[]>();
  readonly suppliers = input.required<readonly Supplier[]>();
  readonly nextNumber = input.required<string>();
  readonly error = input<string | null>(null);

  readonly dismiss = output<void>();
  readonly submitPurchase = output<CreatePurchaseInput>();
  readonly submitOrder = output<CreateOrderInput>();
  readonly createProductPurchase = output<CreateNewProductPurchaseInput>();
  readonly createSupplier = output<string>();

  readonly paymentMethods = PURCHASE_PAYMENT_METHODS;

  readonly stage = signal<WizardStage>('choice');
  readonly step = signal(1);
  readonly maxVisited = signal(1);
  readonly lines = signal<readonly PurchaseLineInput[]>([]);
  readonly productQuery = signal('');
  readonly selectedSupplierId = signal('');
  readonly manualSupplierName = signal('');
  readonly showSupplierForm = signal(false);
  readonly paymentMethod = signal<PurchasePaymentMethod>('efectivo');
  readonly status = signal<PurchaseStatus>('recibida');
  readonly notes = signal('');
  readonly date = signal(purchaseToday());
  readonly localError = signal<string | null>(null);
  readonly newProductTotal = signal(0);

  readonly steps = computed<readonly WizardStep[]>(() =>
    this.mode() === 'orden'
      ? [
          { value: 1, label: 'Proveedor' },
          { value: 2, label: 'Productos' },
          { value: 3, label: 'Carrito' },
          { value: 4, label: 'Resumen' },
          { value: 5, label: 'Confirmar' },
        ]
      : [
          { value: 1, label: 'Proveedor' },
          { value: 2, label: 'Productos' },
          { value: 3, label: 'Carrito' },
          { value: 4, label: 'Resumen' },
          { value: 5, label: 'Pago' },
          { value: 6, label: 'Estado' },
          { value: 7, label: 'Confirmar' },
        ],
  );

  readonly title = computed(() =>
    this.mode() === 'orden' ? 'Nueva Orden de Compra' : 'Nueva Compra',
  );

  readonly total = computed(() =>
    round2(this.lines().reduce((sum, line) => sum + line.quantity * line.unitCost, 0)),
  );

  readonly units = computed(() =>
    round2(this.lines().reduce((sum, line) => sum + line.quantity, 0)),
  );

  readonly filteredProducts = computed(() => {
    const query = this.productQuery().trim().toLowerCase();
    if (!query) return this.products();
    return this.products().filter((product) =>
      `${product.name} ${product.code} ${product.category}`.toLowerCase().includes(query),
    );
  });

  readonly selectedSupplier = computed(() => {
    const id = this.selectedSupplierId();
    if (!id) return null;
    return this.suppliers().find((supplier) => supplier.id === id) ?? null;
  });

  readonly supplierLabel = computed(() => {
    const supplier = this.selectedSupplier();
    const manual = this.manualSupplierName().trim();
    return supplier?.name || manual || 'Sin proveedor';
  });

  readonly nextDisabled = computed(() => {
    const step = this.step();
    if (step === 2 || step === 3) return this.lines().length === 0;
    return false;
  });

  private readonly fb = inject(FormBuilder);

  readonly newProductForm = this.fb.nonNullable.group({
    supplierId: [''],
    name: ['', [Validators.required, Validators.maxLength(140)]],
    category: ['', Validators.maxLength(80)],
    sku: ['', Validators.maxLength(60)],
    paymentMethod: ['efectivo' as PurchasePaymentMethod, Validators.required],
    unitCost: [0, [Validators.required, Validators.min(0.01)]],
    salePrice: [0, [Validators.required, Validators.min(0.01)]],
    quantity: [1, [Validators.required, Validators.min(1)]],
  });

  private readonly syncNewProductTotal = this.newProductForm.valueChanges
    .pipe(takeUntilDestroyed())
    .subscribe((value) => {
      this.newProductTotal.set(round2(Number(value.unitCost) * Number(value.quantity)));
    });

  private readonly resetOnOpen = effect(() => {
    if (!this.open()) return;
    this.stage.set(this.mode() === 'orden' ? 'wizard' : 'choice');
    this.step.set(1);
    this.maxVisited.set(1);
    this.lines.set([]);
    this.productQuery.set('');
    this.selectedSupplierId.set('');
    this.manualSupplierName.set('');
    this.showSupplierForm.set(false);
    this.paymentMethod.set('efectivo');
    this.status.set('recibida');
    this.notes.set('');
    this.date.set(purchaseToday());
    this.localError.set(null);
    this.newProductForm.reset({
      supplierId: '',
      name: '',
      category: '',
      sku: '',
      paymentMethod: 'efectivo',
      unitCost: 0,
      salePrice: 0,
      quantity: 1,
    });
    this.newProductTotal.set(0);
  });

  selectStage(stage: 'existing' | 'new'): void {
    if (stage === 'existing') {
      this.stage.set('wizard');
      this.step.set(1);
      return;
    }
    this.stage.set('new-product');
    this.localError.set(null);
  }

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

  setProductQuery(event: Event): void {
    this.productQuery.set((event.target as HTMLInputElement).value);
  }

  addProduct(product: PurchaseProductOption): void {
    const unitCost = product.cost > 0 ? product.cost : product.price > 0 ? product.price : 0.01;
    const current = this.lines();
    const existing = current.findIndex((line) => line.productId === product.id);
    if (existing >= 0) {
      this.lines.set(
        current.map((item, index) =>
          index === existing ? { ...item, quantity: item.quantity + 1 } : item,
        ),
      );
      this.localError.set(null);
      return;
    }
    this.lines.set([
      ...current,
      {
        productId: product.id,
        name: product.name,
        sku: product.code,
        quantity: 1,
        unitCost,
        salePrice: product.price,
      },
    ]);
    this.localError.set(null);
  }

  incrementLine(index: number): void {
    this.lines.set(
      this.lines().map((line, current) =>
        current === index ? { ...line, quantity: line.quantity + 1 } : line,
      ),
    );
  }

  decrementLine(index: number): void {
    this.lines.set(
      this.lines().flatMap((line, current) => {
        if (current !== index) return [line];
        if (line.quantity <= 1) return [];
        return [{ ...line, quantity: line.quantity - 1 }];
      }),
    );
  }

  setQuantity(index: number, event: Event): void {
    const quantity = Math.max(1, Math.trunc(Number((event.target as HTMLInputElement).value)));
    this.lines.set(
      this.lines().map((line, current) =>
        current === index ? { ...line, quantity: Number.isFinite(quantity) ? quantity : 1 } : line,
      ),
    );
  }

  setUnitCost(index: number, event: Event): void {
    const cost = Math.max(0, Number((event.target as HTMLInputElement).value));
    this.lines.set(
      this.lines().map((line, current) =>
        current === index ? { ...line, unitCost: Number.isFinite(cost) ? round2(cost) : 0 } : line,
      ),
    );
  }

  removeLine(index: number): void {
    this.lines.set(this.lines().filter((_, current) => current !== index));
  }

  onPaymentChange(event: Event): void {
    this.paymentMethod.set((event.target as HTMLSelectElement).value as PurchasePaymentMethod);
  }

  onStatusChange(event: Event): void {
    this.status.set((event.target as HTMLSelectElement).value as PurchaseStatus);
  }

  onNotes(event: Event): void {
    this.notes.set((event.target as HTMLTextAreaElement).value);
  }

  onDate(event: Event): void {
    this.date.set((event.target as HTMLInputElement).value);
  }

  goToStep(value: number): void {
    if (value > this.maxVisited()) return;
    this.step.set(value);
    this.localError.set(null);
  }

  next(): void {
    if ((this.step() === 2 || this.step() === 3) && this.lines().length === 0) {
      this.localError.set('Agrega al menos un producto al carrito.');
      return;
    }
    const next = Math.min(this.steps().length, this.step() + 1);
    this.step.set(next);
    this.maxVisited.update((value) => Math.max(value, next));
    this.localError.set(null);
  }

  previous(): void {
    if (this.step() === 1) {
      if (this.mode() === 'compra') this.stage.set('choice');
      return;
    }
    this.step.update((value) => Math.max(1, value - 1));
    this.localError.set(null);
  }

  stepClass(value: number): string {
    const base =
      'flex items-center gap-2 rounded-xl px-2 py-1.5 text-[10px] font-black tracking-widest uppercase transition-colors';
    if (value === this.step()) return `${base} bg-accent-600 text-white`;
    if (value < this.step()) return `${base} text-accent-600 dark:text-accent-400`;
    return `${base} text-slate-400`;
  }

  stepCircleClass(value: number): string {
    const base =
      'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-black';
    if (value === this.step()) return `${base} bg-white/20 text-white`;
    if (value < this.step())
      return `${base} bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300`;
    return `${base} bg-slate-100 text-slate-400 dark:bg-surface-700`;
  }

  submitWizard(): void {
    if (this.lines().length === 0) {
      this.localError.set('Agrega al menos un producto al carrito.');
      return;
    }
    this.localError.set(null);
    const lines = this.lines();
    const supplier = this.selectedSupplier();
    const supplierName = this.supplierLabel();
    if (this.mode() === 'orden') {
      this.submitOrder.emit({
        date: this.date(),
        supplierId: supplier?.id ?? null,
        supplierName,
        lines,
        notes: this.notes().trim(),
      });
      return;
    }
    this.submitPurchase.emit({
      date: this.date(),
      supplierId: supplier?.id ?? null,
      supplierName,
      paymentMethod: this.paymentMethod(),
      status: this.status(),
      origin: 'productos',
      costType: 'inventario',
      lines,
      notes: this.notes().trim(),
    });
  }

  submitNewProduct(): void {
    if (this.newProductForm.invalid) {
      this.newProductForm.markAllAsTouched();
      return;
    }
    const value = this.newProductForm.getRawValue();
    const supplier = this.suppliers().find((item) => item.id === value.supplierId);
    this.localError.set(null);
    this.createProductPurchase.emit({
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
