import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FocusTrapDirective } from '../../../../../shared/directives/focus-trap.directive';
import type { CatalogProduct } from '../../../../applications/products/public-api';
import type {
  CompanyInventoryMovementFormValue,
  CompanyInventoryMovementLine,
  CompanyInventoryMovementType,
} from '../../../../applications/empresas/public-api';

/** Modal de registro de movimientos de inventario (R-PS-04). */
@Component({
  selector: 'app-company-inventory-movement-modal',
  standalone: true,
  imports: [ReactiveFormsModule, FocusTrapDirective],
  templateUrl: './company-inventory-movement-modal.component.html',
})
export class CompanyInventoryMovementModalComponent {
  readonly open = input(false);
  readonly initialType = input<CompanyInventoryMovementType>('entrada');
  readonly products = input<readonly CatalogProduct[]>([]);
  readonly saving = input(false);
  readonly error = input<string | null>(null);

  readonly save = output<CompanyInventoryMovementFormValue>();
  readonly dismiss = output<void>();

  private readonly fb = inject(FormBuilder);
  readonly lines = signal<CompanyInventoryMovementLine[]>([]);

  readonly form = this.fb.nonNullable.group({
    type: ['entrada' as CompanyInventoryMovementType, [Validators.required]],
    reason: ['', [Validators.maxLength(200)]],
    reference: ['', [Validators.maxLength(80)]],
    origin: ['', [Validators.maxLength(120)]],
    destination: ['', [Validators.maxLength(120)]],
  });

  private readonly syncForm = effect(() => {
    if (!this.open()) return;
    this.form.reset({
      type: this.initialType(),
      reason: '',
      reference: '',
      origin: '',
      destination: '',
    });
    this.lines.set([{ productId: '', sku: '', name: '', quantity: 1 }]);
  });

  isTransfer(): boolean {
    return this.form.controls.type.value === 'traslado';
  }

  addLine(): void {
    this.lines.update((lines) => [...lines, { productId: '', sku: '', name: '', quantity: 1 }]);
  }

  removeLine(index: number): void {
    this.lines.update((lines) => lines.filter((_, position) => position !== index));
  }

  selectProduct(index: number, productId: string): void {
    const product = this.products().find((candidate) => candidate.id === productId);
    this.lines.update((lines) =>
      lines.map((line, position) =>
        position === index
          ? {
              ...line,
              productId: product?.id ?? '',
              sku: product?.sku ?? '',
              name: product?.name ?? '',
            }
          : line,
      ),
    );
  }

  setQuantity(index: number, value: string): void {
    const quantity = Math.max(1, Math.trunc(Number(value) || 1));
    this.lines.update((lines) =>
      lines.map((line, position) => (position === index ? { ...line, quantity } : line)),
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
      type: raw.type,
      reason: raw.reason.trim(),
      reference: raw.reference.trim(),
      origin: raw.origin.trim(),
      destination: raw.destination.trim(),
      lines: this.lines().filter((line) => line.sku.trim()),
    });
  }
}
