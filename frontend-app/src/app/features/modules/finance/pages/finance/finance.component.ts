import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NotificationService } from '../../../../../core/services/notification/notification.service';
import { StoreConfigService } from '../../../../../core/services/store-config/store-config.service';
import { injectSeoPage } from '../../../../../core/services/seo/seo.service';
import { AuthStore } from '../../../../applications/auth/public-api';
import { CompanySalesStore } from '../../../../applications/empresas/public-api';
import {
  BanksStore,
  type BankAccount,
  type CreateBankAccountPayload,
} from '../../../../domains/banks/public-api';
import {
  CASH_SECTIONS,
  CASH_TRANSFER_CASH_ID,
  FinanceStore,
  cashDateKey,
  salesToCashMovements,
  type CashPaymentMethod,
  type CashPeriod,
  type CashSaleInput,
  type CashSection,
  type CashTransferAccount,
  type CreateCashClosurePayload,
  type CreateCashMovementPayload,
  type CreateCashPaymentMethodPayload,
  type CreateCashTransferPayload,
  type CreatePettyCashMovementPayload,
  type FinanceTab,
  type PettyCashMovementType,
} from '../../../../domains/finance/public-api';
import { CashBanksPanelComponent } from '../../components/cash-banks-panel/cash-banks-panel.component';
import { CashBankModalComponent } from '../../components/cash-bank-modal/cash-bank-modal.component';
import { CashClosureModalComponent } from '../../components/cash-closure-modal/cash-closure-modal.component';
import { CashClosuresPanelComponent } from '../../components/cash-closures-panel/cash-closures-panel.component';
import { CashExportModalComponent } from '../../components/cash-export-modal/cash-export-modal.component';
import { CashKpiGridComponent } from '../../components/cash-kpi-grid/cash-kpi-grid.component';
import { CashMethodModalComponent } from '../../components/cash-method-modal/cash-method-modal.component';
import { CashMovementModalComponent } from '../../components/cash-movement-modal/cash-movement-modal.component';
import { CashMovementsPanelComponent } from '../../components/cash-movements-panel/cash-movements-panel.component';
import { CashTransferModalComponent } from '../../components/cash-transfer-modal/cash-transfer-modal.component';
import { CashTransfersPanelComponent } from '../../components/cash-transfers-panel/cash-transfers-panel.component';
import { PettyCashModalComponent } from '../../components/petty-cash-modal/petty-cash-modal.component';
import type { PettyCashModalMode } from '../../components/petty-cash-modal/petty-cash-modal.component.types';
import { PettyCashPanelComponent } from '../../components/petty-cash-panel/petty-cash-panel.component';
import { PaymentMethodsPanelComponent } from '../../components/payment-methods-panel/payment-methods-panel.component';

function buildGreeting(name?: string | null): string {
  const firstName = name?.trim().split(/\s+/)[0] ?? '';
  const hour = new Date().getHours();
  const prefix = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';
  return firstName ? `${prefix}, ${firstName}` : prefix;
}

function isCancelled(status: string, label: string): boolean {
  const value = `${status} ${label}`.toLowerCase();
  return ['cancel', 'anulad', 'devuelt', 'returned'].some((token) => value.includes(token));
}

function localDateFromIso(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : cashDateKey(date);
}

/**
 * Centro financiero de la empresa (ADR-66). La página orquesta el libro manual
 * de `FinanceStore`, las ventas cobradas de `CompanySalesStore` y las cuentas
 * de `BanksStore`; los cálculos viven en los adaptadores y en `withComputed`.
 */
@Component({
  selector: 'app-company-finance',
  standalone: true,
  host: { class: 'block overflow-x-clip' },
  imports: [
    RouterLink,
    CashKpiGridComponent,
    CashMovementsPanelComponent,
    PaymentMethodsPanelComponent,
    CashClosuresPanelComponent,
    PettyCashPanelComponent,
    CashBanksPanelComponent,
    CashTransfersPanelComponent,
    CashMovementModalComponent,
    CashExportModalComponent,
    CashMethodModalComponent,
    CashClosureModalComponent,
    PettyCashModalComponent,
    CashBankModalComponent,
    CashTransferModalComponent,
  ],
  templateUrl: './finance.component.html',
})
export default class FinanceComponent {
  readonly finance = inject(FinanceStore);
  readonly banks = inject(BanksStore);
  readonly sales = inject(CompanySalesStore);
  private readonly auth = inject(AuthStore);
  private readonly notifications = inject(NotificationService);
  private readonly storeConfig = inject(StoreConfigService);

  /** Pestaña del workspace enlazada desde `data.tab`. */
  readonly tab = input<FinanceTab>('cash');
  readonly sections = CASH_SECTIONS;
  readonly section = signal<CashSection>('movements');
  readonly greeting = buildGreeting(this.auth.user()?.name);
  readonly companyName = computed(() => this.storeConfig.companyInfo().name);

  readonly exportOpen = signal(false);
  readonly movementOpen = signal(false);
  readonly methodOpen = signal(false);
  readonly closureOpen = signal(false);
  readonly pettyOpen = signal(false);
  readonly pettyMode = signal<PettyCashModalMode>('movement');
  readonly pettyType = signal<PettyCashMovementType>('gasto');
  readonly bankOpen = signal(false);
  readonly editingBank = signal<BankAccount | null>(null);
  readonly transferOpen = signal(false);

  /** Cuentas del modal de transferencias; se recalcula solo si cambian los saldos. */
  readonly transferAccounts = signal<CashTransferAccount[]>([]);
  private readonly syncTransferAccounts = effect(() => {
    this.transferAccounts.set([
      {
        id: CASH_TRANSFER_CASH_ID,
        label: 'Caja',
        kind: 'cash',
        balance: this.finance.cashKpis().available,
      },
      ...this.banks.accounts().map((account) => ({
        id: account.id,
        label: `${account.bank} · ${account.alias}`,
        kind: 'bank' as const,
        balance: account.balance,
      })),
    ]);
  });

  private readonly loadOrders = this.sales.loadOrders();
  private readonly syncSales = effect(() => {
    const inputs: CashSaleInput[] = this.sales
      .rows()
      .filter((row) => row.paymentGroup === 'cash' && !isCancelled(row.status, row.statusLabel))
      .map((row) => ({
        id: row.id,
        number: row.number,
        date: localDateFromIso(row.date),
        total: row.total,
        paymentMethod: row.paymentLabel,
        paymentLabel: row.paymentLabel,
        source: row.source,
        cancelled: false,
      }))
      .filter((sale) => sale.date !== '');
    this.finance.setExternalCash(salesToCashMovements(inputs));
  });

  private readonly seoService = injectSeoPage(
    'Caja / Pagos — Empresa',
    'Centro financiero del negocio: movimientos, métodos de pago, cierres, caja chica, bancos y transferencias.',
  );

  visibleMethods(): readonly CashPaymentMethod[] {
    const active = this.finance.activeMethods();
    return active.length > 0 ? active : this.finance.methods();
  }

  setSection(section: CashSection): void {
    this.section.set(section);
  }

  sectionClass(value: CashSection): string {
    const base =
      'inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-[10px] font-black tracking-widest uppercase transition-colors';
    return this.section() === value
      ? `${base} bg-accent-600 text-white shadow-sm`
      : `${base} text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-surface-900 dark:hover:text-white`;
  }

  setPeriod(period: CashPeriod): void {
    this.finance.setCashPeriod(period);
  }

  setSearch(search: string): void {
    this.finance.setCashSearch(search);
  }

  openMovement(): void {
    this.movementOpen.set(true);
  }

  saveMovement(payload: CreateCashMovementPayload): void {
    const result = this.finance.addCashMovement(payload);
    if (!result.ok) {
      this.notifications.showError(result.message ?? 'No se pudo registrar el movimiento.');
      return;
    }
    this.movementOpen.set(false);
  }

  annulMovement(id: string): void {
    const result = this.finance.annulCashMovement(id);
    if (!result.ok) {
      this.notifications.showError(result.message ?? 'No se pudo anular el movimiento.');
    }
  }

  saveMethod(payload: CreateCashPaymentMethodPayload): void {
    const result = this.finance.addPaymentMethod(payload);
    if (!result.ok) {
      this.notifications.showError(result.message ?? 'No se pudo crear el método.');
      return;
    }
    this.methodOpen.set(false);
  }

  removeMethod(id: string): void {
    const result = this.finance.removePaymentMethod(id);
    if (!result.ok) {
      this.notifications.showError(result.message ?? 'No se pudo eliminar el método.');
    }
  }

  saveClosure(payload: CreateCashClosurePayload): void {
    const result = this.finance.addCashClosure(payload);
    if (!result.ok) {
      this.notifications.showError(result.message ?? 'No se pudo cerrar la caja.');
      return;
    }
    this.closureOpen.set(false);
  }

  openPetty(type: PettyCashMovementType): void {
    this.pettyMode.set('movement');
    this.pettyType.set(type);
    this.pettyOpen.set(true);
  }

  openFund(): void {
    this.pettyMode.set('fund');
    this.pettyOpen.set(true);
  }

  savePettyMovement(payload: CreatePettyCashMovementPayload): void {
    const result = this.finance.addPettyCashMovement(payload);
    if (!result.ok) {
      this.notifications.showError(result.message ?? 'No se pudo guardar el movimiento.');
      return;
    }
    this.pettyOpen.set(false);
  }

  saveFund(payload: { amount: number; responsible: string }): void {
    const result = this.finance.updatePettyFund(payload.amount, payload.responsible);
    if (!result.ok) {
      this.notifications.showError(result.message ?? 'No se pudo actualizar el fondo.');
      return;
    }
    this.pettyOpen.set(false);
  }

  openBank(account: BankAccount | null = null): void {
    this.editingBank.set(account);
    this.bankOpen.set(true);
  }

  saveBank(payload: CreateBankAccountPayload): void {
    const account = this.editingBank();
    const result = account
      ? this.banks.updateAccount(account.id, payload)
      : this.banks.addAccount(payload);
    if (!result.ok) {
      this.notifications.showError(result.message ?? 'No se pudo guardar la cuenta.');
      return;
    }
    this.bankOpen.set(false);
    this.editingBank.set(null);
  }

  saveTransfer(payload: CreateCashTransferPayload): void {
    if (payload.fromKind === 'bank') {
      const from = this.banks.accounts().find((account) => account.id === payload.fromId);
      if (!from || from.balance < payload.amount) {
        this.notifications.showError('La cuenta de origen no tiene saldo suficiente.');
        return;
      }
    }

    const result = this.finance.addCashTransfer(payload);
    if (!result.ok) {
      this.notifications.showError(result.message ?? 'No se pudo registrar la transferencia.');
      return;
    }

    if (payload.fromKind === 'bank') {
      this.banks.adjustBalance(payload.fromId, -payload.amount);
    }
    if (payload.toKind === 'bank') {
      this.banks.adjustBalance(payload.toId, payload.amount);
    }
    this.transferOpen.set(false);
  }

  cancelTransfer(id: string): void {
    const transfer = this.finance.transfers().find((item) => item.id === id);
    if (!transfer) return;
    if (
      transfer.toKind === 'bank' &&
      (this.banks.accounts().find((account) => account.id === transfer.toId)?.balance ?? 0) <
        transfer.amount
    ) {
      this.notifications.showError('La cuenta destino no tiene saldo suficiente para revertir.');
      return;
    }

    const result = this.finance.annulCashTransfer(id);
    if (!result.ok) {
      this.notifications.showError(result.message ?? 'No se pudo anular la transferencia.');
      return;
    }
    if (transfer.fromKind === 'bank') {
      this.banks.adjustBalance(transfer.fromId, transfer.amount);
    }
    if (transfer.toKind === 'bank') {
      this.banks.adjustBalance(transfer.toId, -transfer.amount);
    }
  }

  openTransfer(): void {
    this.transferOpen.set(true);
  }

  closeBank(): void {
    this.bankOpen.set(false);
    this.editingBank.set(null);
  }

  openExport(): void {
    this.exportOpen.set(true);
  }
}
