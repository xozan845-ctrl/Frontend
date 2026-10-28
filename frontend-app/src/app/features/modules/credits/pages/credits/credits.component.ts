import { Component, inject, signal } from '@angular/core';
import { AppCurrencyPipe } from '../../../../../shared/pipes/app-currency.pipe';
import { AppDatePipe } from '../../../../../shared/pipes/app-date.pipe';
import { injectSeoPage } from '../../../../../core/services/seo/seo.service';
import { CREDITS_SCOPE_CONFIG } from '../../../../../shared/credits/constants/credits-config.tokens';
import { CreditsStore, type CreateCreditPayload } from '../../../../credits/public-api';
import { CreditFormComponent } from '../../components/credit-form/credit-form.component';

/**
 * Créditos compartidos entre empresa y tienda (ADR-70). El scope decide los
 * datos; saldo, vencimiento y cobros viven en el store.
 */
@Component({
  selector: 'app-credits',
  standalone: true,
  imports: [AppCurrencyPipe, AppDatePipe, CreditFormComponent],
  templateUrl: './credits.component.html',
})
export default class CreditsComponent {
  readonly config = inject(CREDITS_SCOPE_CONFIG);
  readonly credits = inject(CreditsStore);
  readonly error = signal<string | null>(null);

  private readonly seoService = injectSeoPage(
    `${this.config.title} — ${this.config.scope === 'company' ? 'Empresa' : 'Panel del vendedor'}`,
    this.config.subtitle,
  );

  addCredit(payload: CreateCreditPayload): void {
    const result = this.credits.addCredit(payload);
    this.error.set(result.ok ? null : (result.message ?? 'No se pudo registrar el crédito.'));
  }
}
