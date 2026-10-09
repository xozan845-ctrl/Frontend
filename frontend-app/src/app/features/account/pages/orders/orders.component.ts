import { Component, DestroyRef, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ORDER_REPOSITORY, OrderResponse } from '../../../cart/public-api';
import { AppCurrencyPipe } from '../../../../shared/pipes/app-currency.pipe';
import { EmptyStateComponent } from '../../../../shared/ui/empty-state/empty-state.component';
import { SkeletonLoaderComponent } from '../../../../shared/ui/skeleton/skeleton-loader.component';
import { SeoService } from '../../../../core/services/seo.service';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [RouterLink, DatePipe, AppCurrencyPipe, EmptyStateComponent, SkeletonLoaderComponent],
  templateUrl: './orders.component.html',
})
export default class OrdersComponent implements OnInit, OnDestroy {
  private readonly orderRepo = inject(ORDER_REPOSITORY);
  private readonly seoService = inject(SeoService);
  private readonly destroyRef = inject(DestroyRef);

  readonly orders = signal<OrderResponse[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  /** Referencia estable para el botón "Reintentar" de `EmptyState` (R-SO-6). */
  readonly retry = () => this.load();

  constructor() {
    this.seoService.setPage('Mis pedidos', 'Historial de tus compras.');
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.orderRepo
      .getOrders()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (orders) => {
          this.orders.set(orders);
          this.loading.set(false);
        },
        error: (err: Error) => {
          this.error.set(err.message || 'No se pudieron cargar tus pedidos.');
          this.loading.set(false);
        },
      });
  }

  ngOnDestroy(): void {
    this.seoService.reset();
  }
}
