import { Component, computed, input } from '@angular/core';
import { ORDER_STATUS_LABELS } from '../../constants/vendor.constants';
import { OrderStatus } from '../../models/vendor-order.model';

/** Clases AA por estado (`R-AC-5`): texto oscuro sobre fondo claro / inverso en dark. */
const STATUS_CLASSES: Readonly<Record<OrderStatus, string>> = {
  pendiente: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  en_proceso: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  completado: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  cancelado: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

/**
 * Badge de estado del pedido (presentacional, `R-SO-8`): etiqueta humana del
 * dominio (`R-UX-4`) y color por estado con contraste AA (`R-AC-5`).
 */
@Component({
  selector: 'app-order-status-badge',
  standalone: true,
  templateUrl: './order-status-badge.component.html',
})
export class OrderStatusBadgeComponent {
  readonly status = input.required<OrderStatus>();

  protected readonly label = computed(() => ORDER_STATUS_LABELS[this.status()]);
  protected readonly badgeClasses = computed(() => STATUS_CLASSES[this.status()]);
}
