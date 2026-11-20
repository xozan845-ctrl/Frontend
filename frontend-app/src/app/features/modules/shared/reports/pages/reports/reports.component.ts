import { Component, inject } from '@angular/core';
import { AppCurrencyPipe } from '@shared/pipes/app-currency.pipe';
import { AppDatePipe } from '@shared/pipes/app-date.pipe';
import { injectSeoPage } from '@core/services/seo/seo.service';
import { REPORTS_SCOPE_CONFIG } from '@shared/reports/constants/reports-config.tokens';
import { ReportsStore, type ReportEntryState } from '@domains/reports/public-api';

/**
 * Reportes compartidos entre empresa y tienda (ADR-71). La página consume el
 * snapshot de la fuente del workspace; no conoce HTTP ni stores de ventas.
 */
@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [AppCurrencyPipe, AppDatePipe],
  templateUrl: './reports.component.html',
})
export default class ReportsComponent {
  readonly config = inject(REPORTS_SCOPE_CONFIG);
  readonly reports = inject(ReportsStore);
  readonly stateLabels: Readonly<Record<ReportEntryState, string>> = {
    pending: 'Pendiente',
    paid: 'Pagada',
    delivered: 'Entregada',
    cancelled: 'Cancelada',
    returned: 'Devuelta',
    unknown: 'Desconocido',
  };

  private readonly seoService = injectSeoPage(
    `${this.config.title} — ${this.config.scope === 'company' ? 'Empresa' : 'Panel del vendedor'}`,
    this.config.subtitle,
  );

  private readonly loadReport = this.reports.load();
}
