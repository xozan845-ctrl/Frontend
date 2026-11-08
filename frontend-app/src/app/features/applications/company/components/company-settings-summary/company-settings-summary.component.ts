import { DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { companyTypeLabel, logisticsModeLabel } from '../../constants/company.constants';
import type { Company } from '../../models/company.model';

/** Tarjeta resumen de la empresa activa. */
@Component({
  selector: 'app-company-settings-summary',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './company-settings-summary.component.html',
})
export default class CompanySettingsSummaryComponent {
  readonly company = input<Company | null>(null);
  readonly logoUrl = input<string | null>(null);
  readonly typeLabel = companyTypeLabel;
  readonly modeLabel = logisticsModeLabel;
}
