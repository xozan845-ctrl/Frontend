import { Component, computed, OnDestroy, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductStore } from '../../../products/public-api';
import { SeoService } from '../../../../core/services/seo.service';

@Component({
  selector: 'app-confirmation',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './confirmation.component.html',
})
export class ConfirmationComponent implements OnDestroy {
  readonly orderNumber = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
  private readonly seoService = inject(SeoService);
  private readonly productStore = inject(ProductStore);

  /** Tienda activa (de la URL) para enlaces store-scoped. */
  readonly storeId = computed(() => this.productStore.storeId() ?? '');

  constructor() {
    this.seoService.setPage('Pedido confirmado', 'Tu pedido en Quantum Store fue confirmado.');
  }

  ngOnDestroy(): void {
    this.seoService.reset();
  }
}
export default ConfirmationComponent;
