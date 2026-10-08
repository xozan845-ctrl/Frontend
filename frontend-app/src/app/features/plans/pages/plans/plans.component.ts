import { Component, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../../core/services/notification.service';
import { SeoService } from '../../../../core/services/seo.service';
import { PLANS, PLAN_FEATURES, PlanTier, PlanFeature } from '../../constants/plans.constants';
import { AppCurrencyPipe } from '../../../../shared/pipes/app-currency.pipe';

@Component({
  selector: 'app-plans',
  standalone: true,
  imports: [CommonModule, AppCurrencyPipe],
  templateUrl: './plans.component.html',
})
export default class PlansComponent implements OnDestroy {
  private readonly notificationService = inject(NotificationService);
  private readonly seoService = inject(SeoService);
  readonly billingType = signal<'personal' | 'empresa'>('personal');
  readonly plans: PlanTier[] = PLANS;
  readonly planFeatures: PlanFeature[] = PLAN_FEATURES;

  constructor() {
    this.seoService.setPage('Planes y suscripciones', 'Elige tu membresía de Quantum Store.');
  }

  ngOnDestroy(): void {
    this.seoService.reset();
  }

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
