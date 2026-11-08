import { Component, input, output } from '@angular/core';
import { AppCurrencyPipe } from '@shared/pipes/app-currency.pipe';

/** Pie de navegación del asistente de nueva venta. */
@Component({
  selector: 'app-company-new-sale-footer',
  standalone: true,
  imports: [AppCurrencyPipe],
  templateUrl: './company-new-sale-footer.component.html',
})
export default class CompanyNewSaleFooterComponent {
  readonly total = input(0);
  readonly hasItems = input(false);
  readonly step = input(1);
  readonly isLastStep = input(false);
  readonly dismiss = output<void>();
  readonly previous = output<void>();
  readonly next = output<void>();
}
