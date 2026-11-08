import { Component, input, output } from '@angular/core';
import { FocusTrapDirective } from '@shared/directives/focus-trap.directive';
import type {
  CompanyCatalogRow,
  CompanyCombo,
  CompanyPromotion,
} from '@domains/company-catalog/public-api';

/** Diálogos de confirmación de baja del catálogo de empresa. */
@Component({
  selector: 'app-company-catalog-delete-dialogs',
  standalone: true,
  imports: [FocusTrapDirective],
  templateUrl: './company-catalog-delete-dialogs.component.html',
})
export default class CompanyCatalogDeleteDialogsComponent {
  readonly service = input<CompanyCatalogRow | null>(null);
  readonly combo = input<CompanyCombo | null>(null);
  readonly promotion = input<CompanyPromotion | null>(null);
  readonly confirmed = output<'service' | 'combo' | 'promotion'>();
  readonly cancelled = output<'service' | 'combo' | 'promotion'>();
}
