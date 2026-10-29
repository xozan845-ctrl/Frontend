import { NgClass } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { AppCurrencyPipe } from '../../../../../shared/pipes/app-currency.pipe';
import { AppDatePipe } from '../../../../../shared/pipes/app-date.pipe';
import type { PurchaseOrderRow } from '../../../../domains/purchases/public-api';

/** Listado de órdenes de compra (solicitudes previas a la compra real). */
@Component({
  selector: 'app-purchase-orders',
  standalone: true,
  imports: [NgClass, AppCurrencyPipe, AppDatePipe],
  templateUrl: './purchase-orders.component.html',
})
export class PurchaseOrdersComponent {
  readonly rows = input.required<readonly PurchaseOrderRow[]>();
  readonly count = input.required<number>();

  readonly back = output<void>();
  readonly newOrder = output<void>();
  readonly convertOrder = output<string>();
  readonly cancelOrder = output<string>();

  statusBadgeClass(status: PurchaseOrderRow['status']): string {
    const base = 'badge ';
    if (status === 'convertida') return `${base}badge-success`;
    if (status === 'anulada') return `${base}badge-danger`;
    return `${base}badge-warning`;
  }
}
