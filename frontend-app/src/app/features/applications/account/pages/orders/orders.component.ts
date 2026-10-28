import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AppCurrencyPipe } from '../../../../../shared/pipes/app-currency.pipe';
import { EmptyStateComponent } from '../../../../../shared/ui/empty-state/empty-state.component';
import { SkeletonLoaderComponent } from '../../../../../shared/ui/skeleton/skeleton-loader.component';
import { injectSeoPage } from '../../../../../core/services/seo/seo.service';
import { AccountOrdersStore } from '../../state/account-orders/account-orders.store';
import { orderStatusLabel } from '../../../cart/public-api';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [RouterLink, DatePipe, AppCurrencyPipe, EmptyStateComponent, SkeletonLoaderComponent],
  templateUrl: './orders.component.html',
})
export default class OrdersComponent {
  private readonly store = inject(AccountOrdersStore);
  private readonly seoService = injectSeoPage('Mis pedidos', 'Historial de tus compras.');

  readonly statusLabel = orderStatusLabel;
  readonly orders = this.store.orders;
  readonly loading = this.store.loading;
  readonly error = this.store.error;

  /** Referencia estable para el botón "Reintentar" de `EmptyState` (R-SO-6). */
  readonly retry = () => this.store.loadOrders();

  private readonly loadOrders = this.store.loadOrders();
}
