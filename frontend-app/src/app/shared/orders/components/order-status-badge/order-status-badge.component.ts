import { Component, computed, input } from '@angular/core';
import { orderStatusMeta } from '../../constants/order-status.constants';
import type { OrderStatusTone } from '../../models/order-status.model';

const TONE_CLASSES: Readonly<Record<OrderStatusTone, string>> = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  danger: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  neutral: 'bg-slate-100 text-slate-600 dark:bg-surface-700 dark:text-slate-300',
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
