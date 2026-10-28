import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { injectSeoPage } from '../../../../../core/services/seo/seo.service';
import { AppCurrencyPipe } from '../../../../../shared/pipes/app-currency.pipe';
import { AppDatePipe } from '../../../../../shared/pipes/app-date.pipe';
import { SkeletonLoaderComponent } from '../../../../../shared/ui/skeleton/skeleton-loader.component';
import { AuthStore } from '../../../../applications/auth/public-api';
import { CompanyNewSaleModalComponent } from '../../components/company-new-sale-modal/company-new-sale-modal.component';
import { CompanyQuickSaleModalComponent } from '../../components/company-quick-sale-modal/company-quick-sale-modal.component';
import { OrderTableComponent } from '../../../../../shared/orders/components/order-table/order-table.component';
import type { OrderTableColumn } from '../../../../../shared/orders/models/order-table.model';
import {
  COMPANY_SALE_PAYMENT_FILTERS,
  COMPANY_SALE_PERIODS,
  CompanySalesStore,
  CompanyServicesStore,
  type CompanySalePaymentFilter,
  type CompanySalePeriod,
  type CreateCompanySalePayload,
} from '../../../../applications/empresas/public-api';

const TAB_CLASSES = {
  active: 'bg-accent-600 text-white shadow-sm',
  idle: 'text-slate-500 hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-surface-800 dark:hover:text-white',
} as const;

const CHIP_CLASSES = {
  active: 'border-accent-600 bg-accent-600 text-white',
  idle: 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:border-surface-600 dark:bg-surface-800 dark:text-slate-300 dark:hover:text-white',
} as const;

/**
 * Centro operativo de ventas del workspace de empresa (ADR-53). La página solo
 * consume señales del store; KPIs, filtros, recurrentes y paginación viven en
 * `CompanySalesStore.withComputed` (`R-CX-3`, `R-ST-3`).
 */
@Component({
  selector: 'app-company-sales',
  standalone: true,
  imports: [
    RouterLink,
    AppCurrencyPipe,
    AppDatePipe,
    SkeletonLoaderComponent,
    CompanyNewSaleModalComponent,
    CompanyQuickSaleModalComponent,
    OrderTableComponent,
  ],
  templateUrl: './company-sales.component.html',
})
export default class CompanySalesComponent {
  readonly sales = inject(CompanySalesStore);
  readonly services = inject(CompanyServicesStore);
  private readonly auth = inject(AuthStore);
  private readonly seoService = injectSeoPage(
    'Ventas — Empresa',
    'Centro operativo de ventas: registra, controla y analiza cada transacción.',
  );

  readonly periods = COMPANY_SALE_PERIODS;
  readonly saleColumns: readonly OrderTableColumn[] = [
    { key: 'number', label: '# Venta' },
    { key: 'date', label: 'Fecha' },
    { key: 'client', label: 'Cliente' },
    { key: 'payment', label: 'Método' },
    { key: 'products', label: 'Productos' },
    { key: 'provider', label: 'Proveedor' },
    { key: 'total', label: 'Total', align: 'right' },
    { key: 'profit', label: 'Ganancia', align: 'right' },
    { key: 'status', label: 'Estado' },
  ];
  readonly paymentFilters = COMPANY_SALE_PAYMENT_FILTERS;
  readonly newSaleOpen = signal(false);
  readonly quickSaleOpen = signal(false);
  readonly newSaleError = signal<string | null>(null);
  readonly quickSaleError = signal<string | null>(null);

  readonly greeting = buildGreeting(this.auth.user()?.name);

  readonly hasCustomPeriod = computed(() => this.sales.period() === 'custom');

  private readonly loadOrders = this.sales.loadOrders();
  private readonly loadProducts = this.sales.loadProducts();
  private readonly loadStores = this.sales.loadStores();
  private readonly loadSales = this.sales.loadSales();

  onSearchInput(event: Event): void {
    this.sales.setSearch((event.target as HTMLInputElement).value);
  }

  setPeriod(period: CompanySalePeriod): void {
    this.sales.setPeriod(period);
  }

  setPayment(payment: CompanySalePaymentFilter): void {
    this.sales.setPayment(payment);
  }

  onCustomFrom(event: Event): void {
    this.sales.setCustomFrom((event.target as HTMLInputElement).value);
  }

  onCustomTo(event: Event): void {
    this.sales.setCustomTo((event.target as HTMLInputElement).value);
  }

  sync(): void {
    this.sales.loadOrders();
    this.sales.loadProducts();
    this.sales.loadStores();
    this.sales.loadSales();
  }

  openNewSale(): void {
    this.newSaleError.set(null);
    this.newSaleOpen.set(true);
  }

  closeNewSale(): void {
    this.newSaleOpen.set(false);
  }

  openQuickSale(): void {
    this.quickSaleError.set(null);
    this.quickSaleOpen.set(true);
  }

  closeQuickSale(): void {
    this.quickSaleOpen.set(false);
  }

  submitNewSale(payload: CreateCompanySalePayload): void {
    const result = this.sales.createSale(payload);
    if (!result.ok) {
      this.newSaleError.set(result.message ?? 'No se pudo registrar la venta.');
      return;
    }
    this.newSaleError.set(null);
    this.newSaleOpen.set(false);
  }

  submitQuickSale(payload: CreateCompanySalePayload): void {
    const result = this.sales.createSale(payload);
    if (!result.ok) {
      this.quickSaleError.set(result.message ?? 'No se pudo registrar la venta.');
      return;
    }
    this.quickSaleError.set(null);
    this.quickSaleOpen.set(false);
  }

  tabClass(period: CompanySalePeriod): string {
    const base =
      'inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[10px] font-black tracking-widest uppercase transition-colors';
    return `${base} ${this.sales.period() === period ? TAB_CLASSES.active : TAB_CLASSES.idle}`;
  }

  chipClass(payment: CompanySalePaymentFilter): string {
    const base =
      'rounded-lg border px-3 py-1.5 text-[10px] font-black tracking-widest uppercase transition-colors';
    return `${base} ${this.sales.payment() === payment ? CHIP_CLASSES.active : CHIP_CLASSES.idle}`;
  }

  statusBadgeClass(status: string): string {
    const base = 'rounded-full px-2.5 py-1 text-[10px] font-black tracking-widest uppercase ';
    const normalized = status.toLowerCase();
    if (['pagada', 'entregada', 'enviada'].includes(normalized)) {
      return `${base}bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300`;
    }
    if (['cancelada', 'devuelta', 'cancelled', 'returned'].includes(normalized)) {
      return `${base}bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300`;
    }
    return `${base}bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300`;
  }
}

function buildGreeting(name?: string | null): string {
  const firstName = name?.trim().split(/\s+/)[0] ?? '';
  const hour = new Date().getHours();
  const prefix = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';
  return firstName ? `${prefix}, ${firstName}` : prefix;
}
