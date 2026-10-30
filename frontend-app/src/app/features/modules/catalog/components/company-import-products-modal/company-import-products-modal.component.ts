import { Component, effect, input, output, signal } from '@angular/core';
import { FocusTrapDirective } from '../../../../../shared/directives/focus-trap.directive';
import { parseProductsCsv } from '../../../../applications/empresas/public-api';
import type {
  CompanyProductImportResult,
  CompanyProductImportRow,
} from '../../../../applications/empresas/public-api';

/** Modal de importación CSV con validación y vista previa (R-PS-04). */
@Component({
  selector: 'app-company-import-products-modal',
  standalone: true,
  imports: [FocusTrapDirective],
  templateUrl: './company-import-products-modal.component.html',
})
export class CompanyImportProductsModalComponent {
  readonly open = input(false);
  readonly saving = input(false);
  readonly result = input<CompanyProductImportResult | null>(null);
  readonly error = input<string | null>(null);

  readonly importRows = output<readonly CompanyProductImportRow[]>();
  readonly dismiss = output<void>();

  readonly rows = signal<CompanyProductImportRow[]>([]);
  readonly parseErrors = signal<string[]>([]);
  readonly fileName = signal('');

  private readonly resetOnOpen = effect(() => {
    if (this.open()) {
      this.rows.set([]);
      this.parseErrors.set([]);
      this.fileName.set('');
    }
  });

  close(): void {
    if (this.saving()) return;
    this.dismiss.emit();
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.fileName.set(file.name);
    const text = await file.text();
    const parsed = parseProductsCsv(text);
    this.rows.set(parsed.rows);
    this.parseErrors.set(parsed.errors);
    input.value = '';
  }

  submit(): void {
    if (this.saving() || this.rows().length === 0) return;
    this.importRows.emit(this.rows());
  }
}
