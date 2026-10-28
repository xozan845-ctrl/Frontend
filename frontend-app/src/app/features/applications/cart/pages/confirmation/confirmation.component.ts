import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductStore } from '../../../products/public-api';
import { OrderStore } from '../../state/order/order.store';
import { orderStatusLabel } from '../../models/order.model';
import { AppCurrencyPipe } from '../../../../../shared/pipes/app-currency.pipe';
import { injectSeoPage } from '../../../../../core/services/seo/seo.service';

@Component({
  selector: 'app-confirmation',
  standalone: true,
  imports: [RouterLink, AppCurrencyPipe],
  templateUrl: './confirmation.component.html',
})
export class ConfirmationComponent {
  private readonly seoService = injectSeoPage(
    'Pedido confirmado',
    'Tu pedido en Quantum Store fue confirmado.',
  );
  private readonly productStore = inject(ProductStore);
  private readonly orderStore = inject(OrderStore);

  /** Orden real devuelta por Core Engine (`POST /orders`). */
  readonly statusLabel = orderStatusLabel;
  readonly order = computed(() => this.orderStore.lastOrder());

  /** Tienda activa (de la URL) para enlaces store-scoped. */
  readonly storeId = computed(() => this.productStore.storeId() ?? '');

  readonly createdAtLabel = computed(() => {
    const createdAt = this.order()?.createdAt;
    if (!createdAt) return '';
    const date = new Date(createdAt);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleString('es-NI');
  });
}
export default ConfirmationComponent;
