import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { injectSeoPage } from '../../../../core/services/seo/seo.service';
import { AppCurrencyPipe } from '../../../../shared/pipes/app-currency.pipe';
import { SkeletonLoaderComponent } from '../../../../shared/ui/skeleton/skeleton-loader.component';
import { orderStatusLabel } from '../../../cart/public-api';
import { AdminOrdersStore } from '../../state/orders/admin-orders.store';

/** Estados objetivo válidos para `PATCH /orders/:id/estado`. */
const TARGET_STATES = [
  { value: 'en_preparacion', label: 'En preparación' },
  { value: 'enviada', label: 'Enviada' },
  { value: 'entregada', label: 'Entregada' },
  { value: 'cancelada', label: 'Cancelada' },
  { value: 'devuelta', label: 'Devuelta' },
] as const;

/** Órdenes para administración (ADR-36): lista global, detalle y transición. */
@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [RouterLink, DatePipe, AppCurrencyPipe, SkeletonLoaderComponent],
  templateUrl: './orders.component.html',
})
export default class AdminOrdersComponent {
  readonly orders = inject(AdminOrdersStore);
  private readonly seoService = injectSeoPage(
    'Pedidos — Administración',
    'Consulta todas las órdenes, su detalle, timeline y estado logístico.',
  );

  readonly statusLabel = orderStatusLabel;
  readonly targetStates = TARGET_STATES;
  readonly targetStatus = signal<string>('en_preparacion');
  readonly reason = signal('');

  private readonly loadOrders = this.orders.load();

  onStatusFilterChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.orders.setStatusFilter(value || null);
  }

  selectOrder(id: string | number): void {
    this.orders.selectOrder(String(id));
  }

  advanceStatus(): void {
    this.orders.advanceStatus({
      status: this.targetStatus(),
      reason: this.reason().trim() || undefined,
    });
  }

  onTargetStatusChange(event: Event): void {
    this.targetStatus.set((event.target as HTMLSelectElement).value);
  }

  onReasonInput(event: Event): void {
    this.reason.set((event.target as HTMLInputElement).value);
  }
}
