import { Component, computed, input } from '@angular/core';
import { orderStatusMeta } from '../../constants/order-status.constants';
import type { OrderStatusTone } from '../../models/order-status.model';

const TONE_CLASSES: Readonly<Record<OrderStatusTone, string>> = {
  pending: 'badge-warning',
  info: 'badge-info',
  success: 'badge-success',
  danger: 'badge-danger',
  neutral: 'badge-neutral',
};

/** Badge de estado de pedido compartido por empresa y vendedor. */
@Component({
  selector: 'app-order-status-badge',
  standalone: true,
  templateUrl: './order-status-badge.component.html',
})
export class OrderStatusBadgeComponent {
  readonly status = input.required<string>();

  protected readonly meta = computed(() => orderStatusMeta(this.status()));
  protected readonly badgeClasses = computed(() => TONE_CLASSES[this.meta().tone]);
}
