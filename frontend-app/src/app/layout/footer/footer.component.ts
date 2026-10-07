import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NotificationService } from '../../shared/ui/notification/notification.service';
import { StoreConfigService } from '../../shared/services/store-config.service';

@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css',
})
export class Footer {
  private readonly notificationService = inject(NotificationService);
  private readonly storeConfig = inject(StoreConfigService);
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
