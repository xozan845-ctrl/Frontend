import { Component, computed, input } from '@angular/core';
import { CashMoneyPipe } from '../../../../../shared/pipes/cash-money.pipe';
import type { CashKpis } from '../../../../domains/finance/public-api';

interface KpiCard {
  label: string;
  value: number;
  hint: string;
  icon: string;
  iconClass: string;
  money: boolean;
  valueClass?: string;
}

/** Tarjetas del centro financiero; solo presenta los KPIs del store. */
@Component({
  selector: 'app-cash-kpi-grid',
  standalone: true,
  imports: [CashMoneyPipe],
  template: `
    <section
      class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6"
      aria-label="Resumen de caja"
    >
      @for (card of cards(); track card.label) {
        <article class="card flex items-start gap-3 p-4">
          <span
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            [class]="card.iconClass"
            aria-hidden="true"
          >
            <i [class]="card.icon"></i>
          </span>
          <div class="min-w-0">
            <p class="truncate text-[10px] font-bold tracking-widest text-slate-400 uppercase">
              {{ card.label }}
            </p>
            <p
              class="mt-0.5 truncate font-heading text-lg font-black tabular-nums"
              [class]="card.valueClass ?? ''"
            >
              @if (card.money) {
                {{ card.value | cashMoney }}
              } @else {
                {{ card.value }}
              }
            </p>
            <p class="truncate text-[10px] text-slate-400">{{ card.hint }}</p>
          </div>
        </article>
      }
    </section>
  `,
})
export class CashKpiGridComponent {
  readonly kpis = input.required<CashKpis>();

  readonly cards = computed<KpiCard[]>(() => {
    const kpis = this.kpis();
    return [
      {
        label: 'Caja disponible',
        value: kpis.available,
        hint: 'Saldo actual',
        icon: 'fa-solid fa-dollar-sign',
        iconClass: 'bg-accent-50 text-accent-600 dark:bg-accent-900/20 dark:text-accent-400',
        money: true,
        valueClass: kpis.available < 0 ? 'text-red-600 dark:text-red-400' : '',
      },
      {
        label: 'Ingresos del mes',
        value: kpis.monthIncome,
        hint:
          kpis.monthIncomeCount > 0 ? `${kpis.monthIncomeCount} entradas` : 'Sin entradas este mes',
        icon: 'fa-solid fa-chart-line',
        iconClass: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
        money: true,
        valueClass: 'text-emerald-600 dark:text-emerald-400',
      },
      {
        label: 'Egresos del mes',
        value: kpis.monthExpense,
        hint:
          kpis.monthExpenseCount > 0 ? `${kpis.monthExpenseCount} salidas` : 'Sin egresos este mes',
        icon: 'fa-solid fa-arrow-trend-down',
        iconClass: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
        money: true,
        valueClass: kpis.monthExpense > 0 ? 'text-red-600 dark:text-red-400' : '',
      },
      {
        label: 'Movimientos del mes',
        value: kpis.monthMovements,
        hint: 'este mes',
        icon: 'fa-solid fa-list-ul',
        iconClass: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
        money: false,
      },
      {
        label: 'Otros ingresos',
        value: kpis.otherIncome,
        hint: kpis.otherIncome > 0 ? 'movimientos manuales' : 'Sin otros ingresos',
        icon: 'fa-solid fa-arrow-up',
        iconClass: 'bg-teal-50 text-teal-600 dark:bg-teal-900/20 dark:text-teal-400',
        money: true,
      },
      {
        label: 'Otros egresos',
        value: kpis.otherExpense,
        hint: kpis.otherExpense > 0 ? 'movimientos manuales' : 'Sin otros egresos',
        icon: 'fa-solid fa-arrow-down',
        iconClass: 'bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400',
        money: true,
      },
    ];
  });
}
