import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { injectSeoPage } from '../../../../core/services/seo/seo.service';
import { AppCurrencyPipe } from '../../../../shared/pipes/app-currency.pipe';
import { SkeletonLoaderComponent } from '../../../../shared/ui/skeleton/skeleton-loader.component';
import { orderStatusLabel, type OrderResponse } from '../../../cart/public-api';
import { CompanyPortalStore } from '../../state/company-portal/company-portal.store';

const ORDER_STATES = [
  { value: '', label: 'Todos los estados' },
  { value: 'creada', label: 'Creada' },
  { value: 'pagada', label: 'Pagada' },
  { value: 'en_preparacion', label: 'En preparación' },
  { value: 'enviada', label: 'Enviada' },
  { value: 'entregada', label: 'Entregada' },
  { value: 'cancelada', label: 'Cancelada' },
  { value: 'devuelta', label: 'Devuelta' },
] as const;

/** Ventas y órdenes consolidadas de la empresa (ADR-43). */
@Component({
  selector: 'app-company-orders',
  standalone: true,
  imports: [RouterLink, DatePipe, AppCurrencyPipe, SkeletonLoaderComponent],
  templateUrl: './company-orders.component.html',
})
export default class CompanyOrdersComponent {
  readonly portal = inject(CompanyPortalStore);
  private readonly seoService = injectSeoPage(
    'Ventas — Empresa',
    'Consulta las ventas consolidadas de tus tiendas, su estado y las comisiones.',
  );

  readonly statusLabel = orderStatusLabel;
  readonly orderStates = ORDER_STATES;

  private readonly loadOrders = this.portal.loadOrders();
  private readonly loadSales = this.portal.loadSales();
  private readonly loadStores = this.portal.loadStores();

  onStoreChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.portal.setStoreFilter(value || null);
    this.portal.loadOrders();
  }

  onStatusChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.portal.setStatusFilter(value || null);
    this.portal.loadOrders();
  }

  selectOrder(order: OrderResponse): void {
    this.portal.selectOrder(order);
  }

  closeOrder(): void {
    this.portal.closeOrder();
  }

  statusBadgeClass(status: string): string {
    const base = 'rounded-full px-2.5 py-1 text-[10px] font-black tracking-widest uppercase ';
    if (status === 'entregada' || status === 'pagada') {
      return `${base}bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300`;
    }
    if (status === 'cancelada' || status === 'devuelta') {
      return `${base}bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300`;
    }
    return `${base}bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300`;
  }
}
