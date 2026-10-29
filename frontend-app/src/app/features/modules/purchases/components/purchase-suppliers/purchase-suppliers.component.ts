import { Component, input, output } from '@angular/core';
import { AppCurrencyPipe } from '../../../../../shared/pipes/app-currency.pipe';
import { AppDatePipe } from '../../../../../shared/pipes/app-date.pipe';
import type { SupplierRow } from '../../../../domains/purchases/public-api';

/** Directorio de proveedores con su actividad de compras. */
@Component({
  selector: 'app-purchase-suppliers',
  standalone: true,
  imports: [AppCurrencyPipe, AppDatePipe],
  templateUrl: './purchase-suppliers.component.html',
})
export class PurchaseSuppliersComponent {
  readonly rows = input.required<readonly SupplierRow[]>();
  readonly newSupplier = output<void>();
}
