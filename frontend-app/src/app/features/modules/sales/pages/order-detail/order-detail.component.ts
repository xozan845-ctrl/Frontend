import { Component, DestroyRef, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppCurrencyPipe } from '../../../../../shared/pipes/app-currency.pipe';
import { AppDatePipe } from '../../../../../shared/pipes/app-date.pipe';
import { LineTotalPipe } from '../../../../../shared/pipes/line-total.pipe';
import { injectSeoPage } from '../../../../../core/services/seo/seo.service';
import { SkeletonLoaderComponent } from '../../../../../shared/ui/skeleton/skeleton-loader.component';
import { ConfirmModalComponent } from '../../components/confirm-modal/confirm-modal.component';
import { OrderStatusBadgeComponent } from '../../../../../shared/orders/components/order-status-badge/order-status-badge.component';
import {
  ORDER_STATUS_ACTIONS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TRANSITIONS,
  VendorOrdersStore,
  type OrderStatus,
} from '../../../../applications/vendor/public-api';
import type { TimelineStep } from './order-detail.types';

/**
 * Página "Detalle del pedido" (`pedidos/:id`, ADR-20): resumen, líneas con
 * precios congelados, avance y cambio de estado con confirmación accesible
 * (`R-RB-3`, `R-AC-3`). El estado vive en `VendorOrdersStore` y se limpia al
 * salir (`R-AR-10`); el SEO se fija con el id cargado (`R-UX-6`).
 */
@Component({
  selector: 'app-vendor-order-detail',
  standalone: true,
  imports: [
    RouterLink,
    AppCurrencyPipe,
    AppDatePipe,
    LineTotalPipe,
    ConfirmModalComponent,
    OrderStatusBadgeComponent,
    SkeletonLoaderComponent,
  ],
  templateUrl: './order-detail.component.html',
})
export default class OrderDetailComponent {
  /** Parámetro de ruta (`pedidos/:id`) enlazado con `withComponentInputBinding`. */
  readonly id = input.required<string>();
  readonly orders = inject(VendorOrdersStore);
  private readonly seoService = injectSeoPage(
    'Detalle del pedido — Panel del vendedor',
    'Revisa las líneas, totales y estado de un pedido y actualiza su avance.',
  );
  private readonly loadOrder = this.orders.loadOrder(this.id);

  protected readonly timelineSteps: TimelineStep[] = [
    { status: 'pendiente', label: ORDER_STATUS_LABELS.pendiente },
    { status: 'en_proceso', label: ORDER_STATUS_LABELS.en_proceso },
    { status: 'completado', label: ORDER_STATUS_LABELS.completado },
  ];
  protected readonly actionLabels = ORDER_STATUS_ACTIONS;
  protected readonly pendingStatus = signal<OrderStatus | null>(null);
  protected readonly isConfirmOpen = computed(() => this.pendingStatus() !== null);
  protected readonly confirmLabel = computed(() => {
    const status = this.pendingStatus();
    return status ? (ORDER_STATUS_ACTIONS[status] ?? ORDER_STATUS_LABELS[status]) : 'Confirmar';
  });
  protected readonly confirmMessage = computed(() => {
    const order = this.orders.selectedOrder();
    const status = this.pendingStatus();
    if (!order || !status) return '';
    return `¿Seguro que quieres pasar el pedido ${order.id} a ${ORDER_STATUS_LABELS[status].toLowerCase()}?`;
  });
  protected readonly nextStatuses = computed<readonly OrderStatus[]>(() => {
    const order = this.orders.selectedOrder();
    return order ? ORDER_STATUS_TRANSITIONS[order.status] : [];
  });

  // El SEO toma el id en cuanto el pedido llega.
  private readonly syncOrderSeo = effect(() => {
    const order = this.orders.selectedOrder();
    if (order) {
      this.seoService.setPage(
        `Pedido ${order.id} — Panel del vendedor`,
        `Detalle del pedido ${order.id}: líneas, totales y estado.`,
      );
    }
  });

  // Cierra la confirmación cuando el estado nuevo ya quedó aplicado.
  private readonly resetConfirmOnApply = effect(() => {
    const order = this.orders.selectedOrder();
    const pending = this.pendingStatus();
    if (order && pending && order.status === pending) {
      this.pendingStatus.set(null);
    }
  });

  private readonly cleanup = inject(DestroyRef).onDestroy(() => this.orders.clearSelectedOrder());

  protected requestStatusChange(status: OrderStatus): void {
    this.pendingStatus.set(status);
  }

  protected dismissConfirm(): void {
    this.pendingStatus.set(null);
  }

  protected confirmStatusChange(): void {
    const status = this.pendingStatus();
    if (status) {
      this.orders.updateStatus(status);
    }
  }

  protected actionTone(status: OrderStatus): 'primary' | 'danger' {
    return status === 'cancelado' ? 'danger' : 'primary';
  }

  protected isStepDone(current: OrderStatus, step: OrderStatus): boolean {
    return this.stepIndex(current) > this.stepIndex(step);
  }

  protected isStepCurrent(current: OrderStatus, step: OrderStatus): boolean {
    return current === step;
  }

  protected stepDotClasses(current: OrderStatus, step: OrderStatus): string {
    const base = 'flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors';
    if (this.isStepDone(current, step)) {
      return `${base} bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300`;
    }
    if (this.isStepCurrent(current, step)) return `${base} bg-accent-600 text-white`;
    return `${base} bg-slate-200 text-slate-500 dark:bg-surface-600 dark:text-slate-400`;
  }

  protected stepLabelClasses(current: OrderStatus, step: OrderStatus): string {
    const base = 'text-xs font-bold tracking-widest uppercase';
    if (this.isStepCurrent(current, step)) return `${base} text-accent-600 dark:text-accent-400`;
    if (this.isStepDone(current, step)) return `${base} text-emerald-700 dark:text-emerald-400`;
    return `${base} text-slate-400 dark:text-slate-500`;
  }

  private stepIndex(status: OrderStatus): number {
    return this.timelineSteps.findIndex((step) => step.status === status);
  }
}
