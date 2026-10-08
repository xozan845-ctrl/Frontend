import { Component, computed, OnDestroy, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductStore } from '../../../products/public-api';
import { OrderStore } from '../../state/order.store';
import { AppCurrencyPipe } from '../../../../shared/pipes/app-currency.pipe';
import { SeoService } from '../../../../core/services/seo.service';

@Component({
  selector: 'app-confirmation',
  standalone: true,
  imports: [RouterLink, AppCurrencyPipe],
  templateUrl: './confirmation.component.html',
})
export class ConfirmationComponent implements OnDestroy {
  private readonly seoService = inject(SeoService);
  private readonly productStore = inject(ProductStore);
  private readonly orderStore = inject(OrderStore);

  /** Orden real devuelta por Core Engine (`POST /orders`). */
  readonly order = computed(() => this.orderStore.lastOrder());

  /** Tienda activa (de la URL) para enlaces store-scoped. */
  readonly storeId = computed(() => this.productStore.storeId() ?? '');

  readonly createdAtLabel = computed(() => {
    const createdAt = this.order()?.createdAt;
    if (!createdAt) return '';
    const date = new Date(createdAt);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleString('es-NI');
  });

  constructor() {
    this.seoService.setPage('Pedido confirmado', 'Tu pedido en Quantum Store fue confirmado.');
  }

  ngOnDestroy(): void {
    this.seoService.reset();
  }
}
export default ConfirmationComponent;
