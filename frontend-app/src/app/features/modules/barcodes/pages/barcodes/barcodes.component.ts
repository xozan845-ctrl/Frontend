import { Component, inject, signal } from '@angular/core';
import { AppDatePipe } from '../../../../../shared/pipes/app-date.pipe';
import { injectSeoPage } from '../../../../../core/services/seo/seo.service';
import { BARCODES_SCOPE_CONFIG } from '../../../../../shared/barcodes/constants/barcodes-config.tokens';
import {
  BARCODE_SYMBOLOGIES,
  BarcodesStore,
  type BarcodeSymbology,
  type CreateBarcodeLabelPayload,
} from '../../../../domains/barcodes/public-api';
import { BarcodeFormComponent } from '../../components/barcode-form/barcode-form.component';

/**
 * Códigos de barras compartidos entre empresa y tienda (ADR-69). El scope
 * inyectado decide el título y el almacenamiento.
 */
@Component({
  selector: 'app-barcodes',
  standalone: true,
  imports: [AppDatePipe, BarcodeFormComponent],
  templateUrl: './barcodes.component.html',
})
export default class BarcodesComponent {
  readonly config = inject(BARCODES_SCOPE_CONFIG);
  readonly barcodes = inject(BarcodesStore);
  readonly error = signal<string | null>(null);
  readonly symbologyLabels: Readonly<Record<BarcodeSymbology, string>> = Object.fromEntries(
    BARCODE_SYMBOLOGIES.map((item) => [item.value, item.label]),
  ) as Record<BarcodeSymbology, string>;

  private readonly seoService = injectSeoPage(
    `${this.config.title} — ${this.config.scope === 'company' ? 'Empresa' : 'Panel del vendedor'}`,
    this.config.subtitle,
  );

  addLabel(payload: CreateBarcodeLabelPayload): void {
    const result = this.barcodes.addLabel(payload);
    this.error.set(result.ok ? null : (result.message ?? 'No se pudo registrar la etiqueta.'));
  }
}
