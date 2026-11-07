import { NgClass } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { formatCurrency } from '@core/config/currency.config';
import type { PurchaseKpis } from '@domains/purchases/public-api';
import type { PurchaseKpiCard } from './purchase-kpi-grid.types';

/** Tarjetas de indicadores de compras; recibe el VM ya calculado por el store. */
@Component({
  selector: 'app-purchase-kpi-grid',
  standalone: true,
  imports: [NgClass],
  templateUrl: './purchase-kpi-grid.component.html',
})
export class PurchaseKpiGridComponent {
  readonly kpis = input.required<PurchaseKpis>();

  readonly cards = computed<PurchaseKpiCard[]>(() => {
    const kpis = this.kpis();
    return [
      {
        label: 'Compras hoy',
        value: formatCurrency(kpis.todayTotal),
        hint: `${kpis.todayCount} compras`,
        icon: 'fa-solid fa-box-open',
        iconClass: 'glass-subtle text-accent-600 dark:text-accent-400',
      },
      {
        label: 'Compras del mes',
        value: formatCurrency(kpis.monthTotal),
        hint: `${kpis.monthCount} compras`,
        icon: 'fa-regular fa-calendar',
        iconClass: 'glass-subtle text-violet-600 dark:text-violet-400',
      },
      {
        label: 'Cantidad compras',
        value: String(kpis.totalCount),
        hint: `${kpis.cancelledCount} anuladas`,
        icon: 'fa-solid fa-bars-staggered',
        iconClass: 'glass-subtle text-cyan-600 dark:text-cyan-400',
      },
      {
        label: 'Productos ingresados',
        value: String(kpis.productsEntered),
        hint: 'unidades ingresadas',
        icon: 'fa-solid fa-cubes',
        iconClass: 'glass-subtle text-emerald-600 dark:text-emerald-400',
      },
      {
        label: 'Inversión inventario',
        value: formatCurrency(kpis.inventoryInvestment),
        hint: 'valor en stock',
        icon: 'fa-solid fa-dollar-sign',
        iconClass: 'glass-subtle text-amber-600 dark:text-amber-400',
      },
      {
        label: 'Proveedores activos',
        value: String(kpis.activeSuppliers),
        hint: 'activos',
        icon: 'fa-solid fa-user-group',
        iconClass: 'glass-subtle text-rose-600 dark:text-rose-400',
      },
    ];
  });
}
