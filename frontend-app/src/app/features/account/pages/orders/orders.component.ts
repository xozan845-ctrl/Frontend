import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AppCurrencyPipe } from '../../../../shared/pipes/app-currency.pipe';
import { EmptyStateComponent } from '../../../../shared/ui/empty-state/empty-state.component';
import { SkeletonLoaderComponent } from '../../../../shared/ui/skeleton/skeleton-loader.component';
import { SeoService } from '../../../../core/services/seo.service';
import { AccountOrdersStore } from '../../state/account-orders.store';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [RouterLink, DatePipe, AppCurrencyPipe, EmptyStateComponent, SkeletonLoaderComponent],
  templateUrl: './orders.component.html',
})
export default class OrdersComponent implements OnInit, OnDestroy {
  private readonly store = inject(AccountOrdersStore);
  private readonly seoService = inject(SeoService);

  readonly orders = this.store.orders;
  readonly loading = this.store.loading;
  readonly error = this.store.error;

  /** Referencia estable para el botón "Reintentar" de `EmptyState` (R-SO-6). */
  readonly retry = () => this.store.loadOrders();

  constructor() {
    this.seoService.setPage('Mis pedidos', 'Historial de tus compras.');
  }

  ngOnInit(): void {
    this.store.loadOrders();
  }

  ngOnDestroy(): void {
    this.seoService.reset();
  }
}
