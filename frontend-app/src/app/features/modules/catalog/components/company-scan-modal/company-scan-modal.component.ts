import { Component, effect, input, output, signal } from '@angular/core';
import { FocusTrapDirective } from '../../../../../shared/directives/focus-trap.directive';
import { AppCurrencyPipe } from '../../../../../shared/pipes/app-currency.pipe';
import type { CompanyScanResult } from '../../../../applications/empresas/public-api';

/** Modal de búsqueda por código de barras (R-PS-04). */
@Component({
  selector: 'app-company-scan-modal',
  standalone: true,
  imports: [FocusTrapDirective, AppCurrencyPipe],
  templateUrl: './company-scan-modal.component.html',
})
export class CompanyScanModalComponent {
  readonly open = input(false);
  readonly scanning = input(false);
  readonly result = input<CompanyScanResult | null>(null);
  readonly error = input<string | null>(null);

  readonly scan = output<string>();
  readonly edit = output<CompanyScanResult>();
  readonly dismiss = output<void>();

  readonly code = signal('');

  private readonly resetOnOpen = effect(() => {
    if (this.open()) this.code.set('');
  });

  close(): void {
    if (this.scanning()) return;
    this.dismiss.emit();
  }

  submit(): void {
    if (this.scanning() || !this.code().trim()) return;
    this.scan.emit(this.code().trim());
  }

  editResult(): void {
    const result = this.result();
    if (result) this.edit.emit(result);
  }
}
