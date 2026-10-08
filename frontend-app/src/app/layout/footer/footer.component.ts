import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductStore } from '../../features/products/public-api';
import { NotificationService } from '../../core/services/notification.service';
import { StoreConfigService } from '../../core/services/store-config.service';

@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css',
})
export class Footer {
  private readonly notificationService = inject(NotificationService);
  private readonly storeConfig = inject(StoreConfigService);
  private readonly productStore = inject(ProductStore);

  /** Tienda activa (de la URL) para enlaces store-scoped. */
  readonly storeId = computed(() => this.productStore.storeId() ?? '');
  readonly homeLink = computed(() => (this.storeId() ? ['/tienda', this.storeId()] : ['/']));
  readonly shopLink = computed(() =>
    this.storeId() ? ['/tienda', this.storeId(), 'shop'] : ['/'],
  );

  get companyInfo() {
    return this.storeConfig.companyInfo();
  }
  readonly currentYear = new Date().getFullYear();

  onNewsletterSubmit(event: Event): void {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    this.notificationService.showSuccess('¡Gracias por suscribirte a nuestra newsletter!');
    form.reset();
  }
}
