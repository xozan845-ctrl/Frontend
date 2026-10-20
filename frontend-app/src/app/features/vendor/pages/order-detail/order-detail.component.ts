import { Component, OnDestroy, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppCurrencyPipe } from '../../../../shared/pipes/app-currency.pipe';
import { SeoService } from '../../../../core/services/seo.service';
import { SkeletonLoaderComponent } from '../../../../shared/ui/skeleton/skeleton-loader.component';
import { ConfirmModalComponent } from '../../components/confirm-modal/confirm-modal.component';
import { OrderStatusBadgeComponent } from '../../components/order-status-badge/order-status-badge.component';
import { formatOrderDate } from '../../components/recent-orders-table/recent-orders-table.component';
import {
  ORDER_STATUS_ACTIONS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TRANSITIONS,
} from '../../constants/vendor.constants';
import { OrderLine, OrderStatus } from '../../models/vendor-order.model';
import { VendorOrdersStore } from '../../state/vendor-orders.store';
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
    ConfirmModalComponent,
    OrderStatusBadgeComponent,
    SkeletonLoaderComponent,
  ],
  templateUrl: './order-detail.component.html',
})
export default class OrderDetailComponent implements OnDestroy {
  /** Parámetro de ruta (`pedidos/:id`) enlazado con `withComponentInputBinding`. */
  readonly id = input.required<string>();
  readonly orders = inject(VendorOrdersStore);
  private readonly seoService = inject(SeoService);

  protected readonly timelineSteps: TimelineStep[] = [
    { status: 'pendiente', label: ORDER_STATUS_LABELS.pendiente },
    { status: 'en_proceso', label: ORDER_STATUS_LABELS.en_proceso },
    { status: 'completado', label: ORDER_STATUS_LABELS.completado },
  ];
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

  constructor() {
    this.seoService.setPage(
      'Detalle del pedido — Panel del vendedor',
      'Revisa las líneas, totales y estado de un pedido y actualiza su avance.',
    );

    // Carga el pedido y reacciona a los cambios del parámetro de ruta
    // pasando la señal (ruta reactiva de `rxMethod`, sin lecturas rastreadas).
    this.orders.loadOrder(this.id);

    // El SEO toma el id en cuanto el pedido llega.
    effect(() => {
      const order = this.orders.selectedOrder();
      if (order) {
        this.seoService.setPage(
          `Pedido ${order.id} — Panel del vendedor`,
          `Detalle del pedido ${order.id}: líneas, totales y estado.`,
        );
      }
    });

    // Cierra la confirmación cuando el estado nuevo ya quedó aplicado.
    effect(() => {
      const order = this.orders.selectedOrder();
      const pending = this.pendingStatus();
      if (order && pending && order.status === pending) {
        this.pendingStatus.set(null);
      }
    });
  }

  ngOnDestroy(): void {
    this.orders.clearSelectedOrder();
    this.seoService.reset();
  }

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

  protected actionLabel(status: OrderStatus): string {
    return ORDER_STATUS_ACTIONS[status] ?? ORDER_STATUS_LABELS[status];
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

  protected lineTotal(line: OrderLine): number {
    return Math.round(line.unitPrice * line.quantity * 100) / 100;
  }

  protected formatDate(iso: string): string {
    return formatOrderDate(iso);
  }

  private stepIndex(status: OrderStatus): number {
    return this.timelineSteps.findIndex((step) => step.status === status);
  }
}
