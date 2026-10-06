import { Component, signal } from '@angular/core';
import { COMPANY_INFO } from '../../constants/company.constants';

@Component({
  selector: 'app-floating-support',
  standalone: true,
  templateUrl: './floating-support.component.html',
})
export class FloatingSupportComponent {
  readonly companyInfo = COMPANY_INFO;
  isOpen = signal(false);

  toggle(): void {
    this.isOpen.update((v) => !v);
  }

  openWhatsApp(): void {
    const phone = this.companyInfo.phone;
    const message = encodeURIComponent(this.companyInfo.whatsappMessage);
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank', 'noopener,noreferrer');
  }
}
