import { Component, computed, input, signal } from '@angular/core';
import { COMPANY_INFO, CompanyInfo } from '../../../core/constants/company.constants';

@Component({
  selector: 'app-floating-support',
  standalone: true,
  templateUrl: './floating-support.component.html',
  styleUrl: './floating-support.component.css',
})
export class FloatingSupportComponent {
  /** Datos de soporte confirmados para el contexto activo (R-SH-4). */
  readonly companyInfo = input<CompanyInfo>(COMPANY_INFO);
  readonly support = computed(() => this.companyInfo().support ?? {});
  readonly supportLabel = computed(
    () => this.support().label || (this.companyInfo().name ? 'Soporte' : 'Contacto'),
  );
  readonly email = computed(() => this.support()?.email);
  readonly emailLink = computed(() => {
    const email = this.email();
    if (!email) return undefined;
    const subject = encodeURIComponent(`Consulta ${this.companyInfo().name ?? ''}`.trim());
    return `mailto:${email}?subject=${subject}`;
  });
  readonly whatsappPhone = computed(() => this.support()?.whatsappPhone);
  readonly whatsappMessage = computed(
    () => this.support()?.whatsappMessage ?? this.companyInfo().whatsappMessage,
  );
  readonly responseTime = computed(() => this.support().responseTime);
  readonly note = computed(() => this.support().note);
  readonly hasChannels = computed(() => Boolean(this.whatsappPhone() || this.emailLink()));
  isOpen = signal(false);

  toggle(): void {
    this.isOpen.update((v) => !v);
  }

  openWhatsApp(): void {
    const phone = this.whatsappPhone();
    if (!phone) return;
    const message = encodeURIComponent(this.whatsappMessage() ?? '');
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank', 'noopener,noreferrer');
  }
}
