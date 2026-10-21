import { Component, input, output } from '@angular/core';
import { AppCurrencyPipe } from '../../../../shared/pipes/app-currency.pipe';
import type { PlanFeature, PlanTier } from '../../models/plan.model';

/**
 * Tarjeta de plan para la vista móvil (`R-SO-8`): presentacional, recibe el plan
 * ya resuelto y emite la selección. No conoce stores ni servicios.
 */
@Component({
  selector: 'app-plan-card',
  standalone: true,
  imports: [AppCurrencyPipe],
  templateUrl: './plan-card.component.html',
})
export class PlanCardComponent {
  readonly plan = input.required<PlanTier>();
  readonly features = input.required<readonly PlanFeature[]>();
  readonly price = input.required<number>();
  readonly cycle = input.required<string>();
  readonly planSelected = output<string>();
}
