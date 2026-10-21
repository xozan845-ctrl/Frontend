import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../../core/services/notification/notification.service';
import { injectSeoPage } from '../../../../core/services/seo/seo.service';
import { PLANS, PLAN_FEATURES, PlanTier, PlanFeature } from '../../constants/plans.constants';
import { AppCurrencyPipe } from '../../../../shared/pipes/app-currency.pipe';
import { PlanCardComponent } from '../../components/plan-card/plan-card.component';

@Component({
  selector: 'app-plans',
  standalone: true,
  imports: [CommonModule, AppCurrencyPipe, PlanCardComponent],
  templateUrl: './plans.component.html',
})
export default class PlansComponent {
  private readonly notificationService = inject(NotificationService);
  private readonly seoService = injectSeoPage(
    'Planes y suscripciones',
    'Elige tu membresía de Quantum Store.',
  );
  readonly billingType = signal<'personal' | 'empresa'>('personal');
  readonly plans: PlanTier[] = PLANS;
  readonly planFeatures: PlanFeature[] = PLAN_FEATURES;

  readonly planCards = computed(() =>
    this.plans.map((plan) => ({
      plan,
      price: this.getPlanPrice(plan),
      cycle: plan.id === 'basic' ? 'MES' : this.getBillingCycleText(),
    })),
  );

  selectPlan(planName: string) {
    if (planName === 'Pro') {
      this.notificationService.showSuccess(
        `Plan Pro (${this.billingType()}) seleccionado. Redirigiendo a checkout...`,
      );
    } else {
      this.notificationService.showSuccess(
        'Un especialista de ventas se contactará contigo a la brevedad.',
      );
    }
  }

  getPlanPrice(plan: PlanTier): number {
    return this.billingType() === 'personal' ? plan.priceMonthly : plan.priceYearly;
  }

  getBillingCycleText(): string {
    return this.billingType() === 'personal' ? 'MES' : 'AÑO';
  }
}
