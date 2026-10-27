import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppCurrencyPipe } from '../../../pipes/app-currency.pipe';
import { AppDatePipe } from '../../../pipes/app-date.pipe';
import { OrderStatusBadgeComponent } from '../order-status-badge/order-status-badge.component';
import type { OrderTableColumn, OrderTableRow } from '../../models/order-table.model';

/** Tabla de pedidos compartida por Ventas de empresa y el panel del vendedor. */
@Component({
  selector: 'app-order-table',
  standalone: true,
  imports: [RouterLink, AppCurrencyPipe, AppDatePipe, OrderStatusBadgeComponent],
  templateUrl: './order-table.component.html',
})
export class OrderTableComponent {
  readonly rows = input.required<readonly OrderTableRow[]>();
  readonly columns = input.required<readonly OrderTableColumn[]>();
  readonly dateFormat = input<'short' | 'datetime'>('short');
  readonly rowTestId = input('order-table-row');
  readonly tableTestId = input('order-table');
}
