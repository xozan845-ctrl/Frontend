import { Component, computed, inject, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { injectSeoPage } from '../../../../../core/services/seo/seo.service';
import { AppCurrencyPipe } from '../../../../../shared/pipes/app-currency.pipe';
import {
  FINANCE_TABS,
  FinanceStore,
  type CreateCashMovementPayload,
  type CreateExpensePayload,
  type CreatePurchasePayload,
  type FinanceTab,
} from '../../../../finance/public-api';
import { CashPanelComponent } from '../../components/cash-panel/cash-panel.component';
import { ExpensePanelComponent } from '../../components/expense-panel/expense-panel.component';
import { PurchasePanelComponent } from '../../components/purchase-panel/purchase-panel.component';

/**
 * Compras, gastos y caja de la empresa (ADR-66). La página solo orquesta el
 * store y las pestañas; los totales viven en `FinanceStore.withComputed`.
 */
@Component({
  selector: 'app-company-finance',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    AppCurrencyPipe,
    PurchasePanelComponent,
    ExpensePanelComponent,
    CashPanelComponent,
  ],
  templateUrl: './finance.component.html',
})
export default class FinanceComponent {
  /** Pestaña activa, enlazada desde `data.tab` (`withComponentInputBinding`). */
  readonly tab = input<FinanceTab>('purchases');
  readonly finance = inject(FinanceStore);

  readonly tabs = FINANCE_TABS;
  readonly title = computed(
    () => this.tabs.find((item) => item.value === this.tab())?.label ?? 'Compras',
  );
  readonly subtitle = computed(() => {
    if (this.tab() === 'expenses') return 'Controla los gastos operativos de la empresa.';
    if (this.tab() === 'cash') return 'Consulta el saldo y los movimientos de caja.';
    return 'Órdenes de compra, proveedores y estado de pago.';
  });

  private readonly seoService = injectSeoPage(
    'Compras, gastos y caja — Empresa',
    'Registra compras, controla gastos operativos y consulta los movimientos de caja de tu empresa.',
  );

  createPurchase(payload: CreatePurchasePayload): void {
    this.finance.addPurchase(payload);
  }

  createExpense(payload: CreateExpensePayload): void {
    this.finance.addExpense(payload);
  }

  createCashMovement(payload: CreateCashMovementPayload): void {
    this.finance.addCashMovement(payload);
  }
}
