import { Component, computed, effect, inject, input, output } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { startWith } from 'rxjs/operators';
import { DeliveryMethod, OrderDraftInfo } from '../../models/vendor-order.model';

/**
 * Panel "Información del pedido" del POS (presentacional, `R-SO-8`): tienda,
 * fecha y método de entrega en un formulario reactivo (`R-AR-7`). Sincroniza
 * los cambios del borrador sin bucles y emite solo la info que cambia.
 */
@Component({
  selector: 'app-order-info-fields',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './order-info-fields.component.html',
})
export class OrderInfoFieldsComponent {
  readonly info = input.required<OrderDraftInfo>();
  readonly infoChange = output<Partial<OrderDraftInfo>>();

  private readonly formBuilder = inject(FormBuilder);
  readonly form = this.formBuilder.nonNullable.group({
    date: ['', [Validators.required]],
    deliveryMethod: this.formBuilder.nonNullable.control<DeliveryMethod>('retiro_tienda', [
      Validators.required,
    ]),
  });

  protected readonly storeLabel = computed(() => this.info().storeName || 'Mi tienda');
  /** Método de entrega como signal para pintar el pill activo. */
  protected readonly delivery = toSignal(
    this.form.controls.deliveryMethod.valueChanges.pipe(
      startWith(this.form.controls.deliveryMethod.value),
    ),
    { initialValue: this.form.controls.deliveryMethod.value },
  );

  /** Sincroniza el formulario con los datos y emite solo cambios (`R-AR-15`). */
  private readonly syncInfo = effect(() => {
    const info = this.info();
    const current = this.form.getRawValue();
    if (info.date !== current.date || info.deliveryMethod !== current.deliveryMethod) {
      this.form.patchValue({ date: info.date, deliveryMethod: info.deliveryMethod });
    }
  });

  private readonly emitChanges = this.form.valueChanges
    .pipe(takeUntilDestroyed())
    .subscribe((value) => {
      if (this.form.valid) {
        this.infoChange.emit({ date: value.date, deliveryMethod: value.deliveryMethod });
      }
    });

  isDateInvalid(): boolean {
    const control = this.form.controls.date;
    return control.invalid && (control.dirty || control.touched);
  }

  deliveryClasses(active: boolean): string {
    const base =
      'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-colors';
    return active
      ? `${base} border-accent-600 bg-accent-600 text-white`
      : `${base} border-slate-200 text-slate-600 hover:border-accent-500 dark:border-surface-600 dark:text-slate-300 dark:hover:border-accent-400`;
  }
}
