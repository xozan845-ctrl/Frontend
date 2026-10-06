import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../shared/ui/notification/notification.service';
import { PLANS, PLAN_FEATURES, PlanTier, PlanFeature } from './constants/plans.constants';

@Component({
  selector: 'app-plans',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './plans.component.html',
  styles: [],
})
export default class PlansComponent {
  private readonly notificationService = inject(NotificationService);
  readonly billingType = signal<'personal' | 'empresa'>('personal');
  readonly plans: PlanTier[] = PLANS;
  readonly planFeatures: PlanFeature[] = PLAN_FEATURES;

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
