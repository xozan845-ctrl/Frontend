import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductStore } from '../../features/applications/shop/public-api';
import { NotificationService } from '../../core/services/notification/notification.service';
import { COMPANY_INFO, CompanyInfo } from '../../core/constants/company.constants';

@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css',
})
export class Footer {
  private readonly notificationService = inject(NotificationService);
  private readonly productStore = inject(ProductStore);

  /** Contenido del contexto activo, recibido por contrato de presentación. */
  readonly companyInfo = input<CompanyInfo>(COMPANY_INFO);
  readonly brandName = computed(() => this.companyInfo().name || 'Tienda');
  readonly description = computed(() => this.companyInfo().description);
  readonly socials = computed(() => this.companyInfo().socials ?? {});
  readonly policies = computed(() => this.companyInfo().policies ?? []);
  readonly newsletter = computed(() => this.companyInfo().newsletter);
  readonly email = computed(() => this.companyInfo().email);
  readonly phone = computed(() => this.companyInfo().displayPhone ?? this.companyInfo().phone);
  readonly location = computed(() => this.companyInfo().location);
  readonly hasSocials = computed(() => Object.values(this.socials()).some(Boolean));
  readonly hasContact = computed(() => Boolean(this.email() || this.phone() || this.location()));

  /** Tienda activa (de la URL) para enlaces store-scoped. */
  readonly storeId = computed(() => this.productStore.storeId() ?? '');
  readonly homeLink = computed(() => (this.storeId() ? ['/tienda', this.storeId()] : ['/']));
  readonly shopLink = computed(() =>
    this.storeId() ? ['/tienda', this.storeId(), 'shop'] : ['/'],
  );

  readonly currentYear = new Date().getFullYear();

  /** R-SE-9: sin handlers inline (la CSP bloquea `onclick`). */
  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onNewsletterSubmit(event: Event): void {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    this.notificationService.showSuccess('¡Gracias por suscribirte a nuestra newsletter!');
    form.reset();
  }
}
