import { Component, effect, inject, input, untracked } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AppCurrencyPipe } from '../../../../shared/pipes/app-currency.pipe';
import { EmptyStateComponent } from '../../../../shared/ui/empty-state/empty-state.component';
import { SkeletonLoaderComponent } from '../../../../shared/ui/skeleton/skeleton-loader.component';
import { injectSeoPage } from '../../../../core/services/seo/seo.service';
import { OrderDetailStore } from '../../state/order-detail/order-detail.store';
import { orderStatusLabel } from '../../../cart/public-api';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [RouterLink, DatePipe, AppCurrencyPipe, EmptyStateComponent, SkeletonLoaderComponent],
  templateUrl: './order-detail.component.html',
})
export default class OrderDetailComponent {
  private readonly store = inject(OrderDetailStore);
  private readonly seoService = injectSeoPage(
    'Detalle del pedido',
    'Detalle y seguimiento de tu pedido.',
  );

  /** Id de la orden (`/cuenta/pedidos/:id`, `R-AR-12`). */
  readonly id = input<string>('');

  readonly statusLabel = orderStatusLabel;
  readonly order = this.store.order;
  readonly timeline = this.store.timeline;
  readonly loading = this.store.loading;
  readonly error = this.store.error;

  readonly retry = () => this.store.loadOrder(this.id());

  /** Carga la orden cuando cambia el id de la ruta (`R-AR-15`). */
  private readonly loadFromRoute = effect(() => {
    const id = this.id();
    if (id) untracked(() => this.store.loadOrder(id));
  });
}
