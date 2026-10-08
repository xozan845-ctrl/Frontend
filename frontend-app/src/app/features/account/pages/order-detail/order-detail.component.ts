import { Component, effect, inject, input, signal, untracked } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ORDER_REPOSITORY, OrderResponse, OrderTimelineEvent } from '../../../cart/public-api';
import { AppCurrencyPipe } from '../../../../shared/pipes/app-currency.pipe';
import { EmptyStateComponent } from '../../../../shared/ui/empty-state/empty-state.component';
import { SeoService } from '../../../../core/services/seo.service';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [RouterLink, DatePipe, AppCurrencyPipe, EmptyStateComponent],
  templateUrl: './order-detail.component.html',
})
export default class OrderDetailComponent {
  private readonly orderRepo = inject(ORDER_REPOSITORY);
  private readonly seoService = inject(SeoService);

  /** Id de la orden (`/cuenta/pedidos/:id`, `R-AR-12`). */
  readonly id = input<string>('');

  readonly order = signal<OrderResponse | null>(null);
  readonly timeline = signal<OrderTimelineEvent[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly retry = () => this.load(this.id());

  constructor() {
    this.seoService.setPage('Detalle del pedido', 'Detalle y seguimiento de tu pedido.');
    effect(() => {
      const id = this.id();
      if (id) untracked(() => this.load(id));
    });
  }

  load(id: string): void {
    if (!id) return;
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      order: this.orderRepo.getOrder(id),
      timeline: this.orderRepo.getTimeline(id).pipe(catchError(() => of([]))),
    }).subscribe({
      next: ({ order, timeline }) => {
        this.order.set(order);
        this.timeline.set(timeline);
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message || 'No se pudo cargar el pedido.');
        this.loading.set(false);
      },
    });
  }
}
