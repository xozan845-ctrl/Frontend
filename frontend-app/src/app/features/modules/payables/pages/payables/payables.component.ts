import { Component, inject } from '@angular/core';
import { AppCurrencyPipe } from '../../../../../shared/pipes/app-currency.pipe';
import { AppDatePipe } from '../../../../../shared/pipes/app-date.pipe';
import { injectSeoPage } from '../../../../../core/services/seo/seo.service';
import { PAYABLES_SCOPE_CONFIG } from '../../../../../shared/payables/constants/payables-config.tokens';
import { PayablesStore, type CreatePayablePayload } from '../../../../domains/payables/public-api';
import { PayableFormComponent } from '../../components/payable-form/payable-form.component';

/**
 * Cuentas por pagar compartidas entre empresa y vendedor (ADR-67). El scope
 * inyectado decide el título y el almacenamiento; el store deriva vencidas,
 * totales y filas.
 */
@Component({
  selector: 'app-payables',
  standalone: true,
  imports: [AppCurrencyPipe, AppDatePipe, PayableFormComponent],
  templateUrl: './payables.component.html',
})
export default class PayablesComponent {
  readonly config = inject(PAYABLES_SCOPE_CONFIG);
  readonly payables = inject(PayablesStore);

  private readonly seoService = injectSeoPage(
    `${this.config.title} — ${this.config.scope === 'company' ? 'Empresa' : 'Panel del vendedor'}`,
    this.config.subtitle,
  );

  create(payload: CreatePayablePayload): void {
    this.payables.addPayable(payload);
  }
}
