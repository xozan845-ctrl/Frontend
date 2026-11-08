import { Component, input, output } from '@angular/core';
import { AppCurrencyPipe } from '@shared/pipes/app-currency.pipe';
import type { CompanyCombo } from '@domains/company-catalog/public-api';

/** Sección de combos del catálogo de empresa. */
@Component({
  selector: 'app-company-catalog-combos-section',
  standalone: true,
  imports: [AppCurrencyPipe],
  templateUrl: './company-catalog-combos-section.component.html',
})
export default class CompanyCatalogCombosSectionComponent {
  readonly combos = input<readonly CompanyCombo[]>([]);
  readonly loading = input(false);
  readonly error = input<string | null>(null);
  readonly activeCount = input(0);
  readonly create = output<void>();
  readonly edit = output<CompanyCombo>();
  readonly remove = output<CompanyCombo>();
}
