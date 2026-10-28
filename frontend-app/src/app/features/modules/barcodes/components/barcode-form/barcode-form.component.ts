import { Component, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  BARCODE_MAX_COPIES,
  BARCODE_SYMBOLOGIES,
  type BarcodeSymbology,
  type CreateBarcodeLabelPayload,
} from '../../../../barcodes/public-api';

/** Alta de una etiqueta de código de barras; presentacional (`R-SO-8`). */
@Component({
  selector: 'app-barcode-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './barcode-form.component.html',
})
export class BarcodeFormComponent {
  readonly error = input<string | null>(null);
  readonly createLabel = output<CreateBarcodeLabelPayload>();

  readonly symbologies = BARCODE_SYMBOLOGIES;
  readonly maxCopies = BARCODE_MAX_COPIES;
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.nonNullable.group({
    productName: ['', [Validators.required, Validators.maxLength(160)]],
    sku: ['', [Validators.required, Validators.maxLength(60)]],
    symbology: ['EAN13' as BarcodeSymbology, Validators.required],
    code: ['', Validators.maxLength(40)],
    copies: [1, [Validators.required, Validators.min(1), Validators.max(BARCODE_MAX_COPIES)]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.createLabel.emit({
      productName: value.productName.trim(),
      sku: value.sku.trim(),
      symbology: value.symbology,
      code: value.code.trim(),
      copies: Number(value.copies),
    });
    this.form.reset({
      productName: '',
      sku: '',
      symbology: 'EAN13',
      code: '',
      copies: 1,
    });
  }

  isInvalid(field: 'productName' | 'sku' | 'code' | 'copies'): boolean {
    const control = this.form.controls[field];
    return control.invalid && (control.dirty || control.touched);
  }
}
