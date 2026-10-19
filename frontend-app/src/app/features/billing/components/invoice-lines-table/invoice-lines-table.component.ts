import { Component, input } from '@angular/core';
import { AppCurrencyPipe } from '../../../../shared/pipes/app-currency.pipe';
import { InvoiceLine, invoiceLineTotal } from '../../models/billing.model';

/**
 * Tabla de líneas de la factura (presentacional, `R-SO-8`): vista de detalle y
 * de impresión. Recibe los precios congelados y solo formatea importes.
 */
@Component({
  selector: 'app-invoice-lines-table',
  standalone: true,
  imports: [AppCurrencyPipe],
  templateUrl: './invoice-lines-table.component.html',
})
export class InvoiceLinesTableComponent {
  readonly lines = input.required<readonly InvoiceLine[]>();

  protected lineTotal(line: InvoiceLine): number {
    return invoiceLineTotal(line);
  }
}
