import { Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FocusTrapDirective } from '../../../../../shared/directives/focus-trap.directive';
import type {
  CompanyInventoryCostMethod,
  CompanyInventorySettings,
  CompanyInventorySettingsFormValue,
} from '../../../../applications/empresas/public-api';

/** Modal presentacional de configuración de inventario (R-PS-04). */
@Component({
  selector: 'app-company-inventory-settings-modal',
  standalone: true,
  imports: [ReactiveFormsModule, FocusTrapDirective],
  templateUrl: './company-inventory-settings-modal.component.html',
})
export class CompanyInventorySettingsModalComponent {
  readonly open = input(false);
  readonly settings = input<CompanyInventorySettings | null>(null);
  readonly saving = input(false);
  readonly error = input<string | null>(null);

  readonly save = output<CompanyInventorySettingsFormValue>();
  readonly dismiss = output<void>();

  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.nonNullable.group({
    costMethod: ['promedio' as CompanyInventoryCostMethod, [Validators.required]],
    allowNegativeStock: [false],
    lowStockAlert: [true],
    updateCostOnPurchase: [true],
    defaultUnit: ['Unidad (u)', [Validators.required, Validators.maxLength(40)]],
  });

  private readonly syncForm = effect(() => {
    if (!this.open()) return;
    const settings = this.settings();
    this.form.reset({
      costMethod: settings?.costMethod ?? 'promedio',
      allowNegativeStock: settings?.allowNegativeStock ?? false,
      lowStockAlert: settings?.lowStockAlert ?? true,
      updateCostOnPurchase: settings?.updateCostOnPurchase ?? true,
      defaultUnit: settings?.defaultUnit ?? 'Unidad (u)',
    });
  });

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
      costMethod: raw.costMethod,
      allowNegativeStock: raw.allowNegativeStock,
      lowStockAlert: raw.lowStockAlert,
      updateCostOnPurchase: raw.updateCostOnPurchase,
      defaultUnit: raw.defaultUnit.trim(),
    });
  }
}
