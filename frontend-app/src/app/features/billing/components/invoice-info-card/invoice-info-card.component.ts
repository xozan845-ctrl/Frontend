import { Component, computed, effect, inject, input, output } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { startWith } from 'rxjs/operators';
import { PAYMENT_TERM_LABELS, PAYMENT_TERMS } from '../../constants/billing.constants';
import { InvoiceInfo, PaymentTerm } from '../../models/billing.model';

/**
 * Tarjeta "Información de la factura" (presentacional, `R-SO-8`): tienda,
 * fecha y condición de pago en un formulario reactivo (`R-AR-7`). Sincroniza
 * el estado sin bucles y emite solo lo que cambia.
 */
@Component({
  selector: 'app-invoice-info-card',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './invoice-info-card.component.html',
})
export class InvoiceInfoCardComponent {
  readonly info = input.required<InvoiceInfo>();
  readonly infoChange = output<Partial<InvoiceInfo>>();

  private readonly formBuilder = inject(FormBuilder);
  readonly form = this.formBuilder.nonNullable.group({
    date: ['', [Validators.required]],
    paymentTerm: this.formBuilder.nonNullable.control<PaymentTerm>('contado', [
      Validators.required,
    ]),
  });

  protected readonly terms = PAYMENT_TERMS;
  protected readonly termLabels = PAYMENT_TERM_LABELS;
  protected readonly storeLabel = computed(() => this.info().storeName || 'Mi tienda');
  protected readonly isCredit = computed(() => this.paymentTerm() === 'credito');
  protected readonly paymentTerm = toSignal(
    this.form.controls.paymentTerm.valueChanges.pipe(
      startWith(this.form.controls.paymentTerm.value),
    ),
    { initialValue: this.form.controls.paymentTerm.value },
  );

  /** Sincroniza el formulario con los datos y emite solo cambios (`R-AR-15`). */
  private readonly syncInfo = effect(() => {
    const info = this.info();
    const current = this.form.getRawValue();
    if (info.date !== current.date || info.paymentTerm !== current.paymentTerm) {
      this.form.patchValue({ date: info.date, paymentTerm: info.paymentTerm });
    }
  });

  private readonly emitChanges = this.form.valueChanges
    .pipe(takeUntilDestroyed())
    .subscribe((value) => {
      if (this.form.valid) {
        this.infoChange.emit({ date: value.date, paymentTerm: value.paymentTerm });
      }
    });

  isDateInvalid(): boolean {
    const control = this.form.controls.date;
    return control.invalid && (control.dirty || control.touched);
  }

  termClasses(active: boolean): string {
    const base =
      'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-colors';
    return active
      ? `${base} border-accent-600 bg-accent-600 text-white`
      : `${base} border-slate-200 text-slate-600 hover:border-accent-500 dark:border-surface-600 dark:text-slate-300 dark:hover:border-accent-400`;
  }
}
