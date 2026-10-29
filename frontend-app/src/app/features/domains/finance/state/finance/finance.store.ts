import { computed, effect, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import { NotificationService } from '../../../../../core/services/notification/notification.service';
import { AuthStore } from '../../../../applications/auth/public-api';
import {
  buildCashLedgerDesc,
  cashBalance,
  cashToday,
  computeCashKpis,
  createCashMovementRecord,
  filterCashLedger,
  mergeCashMovements,
  sanitizeCashMovements,
} from '../../adapters/cash/cash-movements.adapter';
import {
  buildCashClosurePreview,
  buildTransferCashMovements,
  computeCashTransferSummary,
  computePettyCashSummary,
  createCashClosure,
  createCashPaymentMethod,
  createCashTransfer,
  createPettyCashMovement,
  createPettyCashFund,
  emptyPettyCashFund,
  sanitizeCashClosures,
  sanitizeCashPaymentMethods,
  sanitizeCashTransfers,
  sanitizePettyCashFund,
  sanitizePettyCashMovements,
  seedCashPaymentMethods,
  summarizeCashPaymentMethods,
} from '../../adapters/cash/cash-sections.adapter';
import {
  CASH_MAX_RECORDS,
  CASH_PAGE_SIZE,
  CASH_PETTY_MAX_RECORDS,
  FINANCE_MAX_RECORDS,
  financeStorageKey,
} from '../../constants/finance.constants';
import {
  computeFinanceSummary,
  createFinanceId,
  sanitizeExpenseRecords,
  sanitizePurchaseRecords,
} from '../../adapters/finance/finance.adapter';
import type {
  CashMovement,
  CashPeriod,
  CreateCashClosurePayload,
  CreateCashMovementPayload,
  CreateCashPaymentMethodPayload,
  CreateCashTransferPayload,
  CreateExpensePayload,
  CreatePettyCashMovementPayload,
  CreatePurchasePayload,
  FinanceMutationResult,
} from '../../models/finance.model';
import type { FinanceState } from './finance.state';

const initialState: FinanceState = {
  purchases: [],
  expenses: [],
  cash: [],
  externalCash: [],
  methods: [],
  closures: [],
  pettyFund: emptyPettyCashFund(),
  pettyMovements: [],
  transfers: [],
  filters: { period: 'mes', search: '', page: 1 },
};

function readStored<T>(storageKey: string, sanitize: (value: unknown) => T[]): T[] {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    return sanitize(JSON.parse(raw) as unknown);
  } catch {
    return [];
  }
}

function readStoredObject<T>(storageKey: string, sanitize: (value: unknown) => T | null): T | null {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    return sanitize(JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}

function persist(storageKey: string, value: unknown): void {
  try {
    localStorage.setItem(storageKey, JSON.stringify(value));
  } catch {
    // Storage no disponible: los datos viven solo en memoria.
  }
}

function hasStored(storageKey: string): boolean {
  try {
    return localStorage.getItem(storageKey) !== null;
  } catch {
    return false;
  }
}

/**
 * Estado financiero de la empresa. El libro de caja combina los movimientos
 * manuales persistidos con las ventas cobradas que la página inyecta desde
 * `CompanySalesStore` (`setExternalCash`). Todos los derivados (saldo corrido,
 * KPIs, filtros, cierres y resúmenes) viven en `withComputed` (`R-ST-3`).
 */
export const FinanceStore = signalStore(
  withState(initialState),
  withComputed((store) => {
    const movements = computed(() => mergeCashMovements(store.cash(), store.externalCash()));
    const ledger = computed(() => buildCashLedgerDesc(movements()));
    const filteredLedger = computed(() =>
      filterCashLedger(ledger(), {
        ...store.filters(),
        flow: 'todos',
        origin: 'todos',
        status: 'completados',
        paymentMethod: 'todas',
        category: 'todas',
        customFrom: '',
        customTo: '',
      }),
    );
    const pageCount = computed(() =>
      Math.max(1, Math.ceil(filteredLedger().length / CASH_PAGE_SIZE)),
    );
    const currentPage = computed(() => Math.min(Math.max(1, store.filters().page), pageCount()));
    const pettySummary = computed(() =>
      computePettyCashSummary(store.pettyFund(), store.pettyMovements()),
    );
    const closurePreview = computed(() => {
      const preview = buildCashClosurePreview(movements(), cashToday());
      const existing = store.closures().find((closure) => closure.date === preview.date) ?? null;
      return { ...preview, existing };
    });

    return {
      summary: computed(() =>
        computeFinanceSummary(store.purchases(), store.expenses(), movements()),
      ),
      movements,
      ledger,
      filteredLedger,
      pageCount,
      currentPage,
      pagedLedger: computed(() =>
        filteredLedger().slice(
          (currentPage() - 1) * CASH_PAGE_SIZE,
          currentPage() * CASH_PAGE_SIZE,
        ),
      ),
      filteredCount: computed(() => filteredLedger().length),
      cashKpis: computed(() => computeCashKpis(movements())),
      cashBalance: computed(() => cashBalance(movements())),
      methodSummaries: computed(() => summarizeCashPaymentMethods(store.methods(), movements())),
      activeMethods: computed(() => store.methods().filter((method) => method.active)),
      pettySummary,
      closurePreview,
      closureHistory: computed(() =>
        store
          .closures()
          .slice()
          .sort((a, b) => b.date.localeCompare(a.date)),
      ),
      transferSummary: computed(() => computeCashTransferSummary(store.transfers())),
      transferHistory: computed(() =>
        store
          .transfers()
          .slice()
          .sort((a, b) => `${b.date}${b.createdAt}`.localeCompare(`${a.date}${a.createdAt}`)),
      ),
      hasPurchases: computed(() => store.purchases().length > 0),
      hasExpenses: computed(() => store.expenses().length > 0),
      hasCash: computed(() => movements().length > 0),
      hasFilteredCash: computed(() => filteredLedger().length > 0),
      hasClosures: computed(() => store.closures().length > 0),
      isFirstPage: computed(() => currentPage() === 1),
      isLastPage: computed(() => currentPage() >= pageCount()),
      hasMethods: computed(() => store.methods().length > 0),
    };
  }),
  withMethods((store, notificationService = inject(NotificationService)) => ({
    addPurchase(payload: CreatePurchasePayload): FinanceMutationResult {
      if (store.purchases().length >= FINANCE_MAX_RECORDS) {
        return { ok: false, message: 'Alcanzaste el límite de compras locales.' };
      }
      const purchase = sanitizePurchaseRecords([
        { ...payload, id: createFinanceId('purchase') },
      ])[0];
      if (!purchase) {
        return { ok: false, message: 'Revisa fecha, proveedor, concepto e importe de la compra.' };
      }
      patchState(store, { purchases: [purchase, ...store.purchases()] });
      notificationService.showSuccess('Compra registrada.');
      return { ok: true };
    },

    addExpense(payload: CreateExpensePayload): FinanceMutationResult {
      if (store.expenses().length >= FINANCE_MAX_RECORDS) {
        return { ok: false, message: 'Alcanzaste el límite de gastos locales.' };
      }
      const expense = sanitizeExpenseRecords([{ ...payload, id: createFinanceId('expense') }])[0];
      if (!expense) {
        return { ok: false, message: 'Revisa fecha, descripción e importe del gasto.' };
      }
      patchState(store, { expenses: [expense, ...store.expenses()] });
      notificationService.showSuccess('Gasto registrado.');
      return { ok: true };
    },

    addCashMovement(payload: CreateCashMovementPayload): FinanceMutationResult {
      if (store.cash().length >= CASH_MAX_RECORDS) {
        return { ok: false, message: 'Alcanzaste el límite de movimientos de caja.' };
      }
      const movement = createCashMovementRecord(payload);
      if (!movement) {
        return { ok: false, message: 'Revisa fecha, concepto e importe del movimiento.' };
      }
      patchState(store, {
        cash: [movement, ...store.cash()],
        filters: { ...store.filters(), page: 1 },
      });
      notificationService.showSuccess('Movimiento de caja registrado.');
      return { ok: true, cashMovement: movement };
    },

    annulCashMovement(id: string): FinanceMutationResult {
      const movement = store.cash().find((item) => item.id === id);
      if (!movement) {
        return { ok: false, message: 'Solo los movimientos manuales se pueden anular.' };
      }
      if (movement.status === 'anulado') {
        return { ok: false, message: 'El movimiento ya está anulado.' };
      }
      patchState(store, {
        cash: store
          .cash()
          .map((item) => (item.id === id ? { ...item, status: 'anulado' as const } : item)),
      });
      notificationService.showInfo('Movimiento anulado.');
      return { ok: true, cashMovement: { ...movement, status: 'anulado' } };
    },

    removePurchase(id: string): void {
      patchState(store, { purchases: store.purchases().filter((item) => item.id !== id) });
      notificationService.showSuccess('Compra eliminada.');
    },

    removeExpense(id: string): void {
      patchState(store, { expenses: store.expenses().filter((item) => item.id !== id) });
      notificationService.showSuccess('Gasto eliminado.');
    },

    removeCashMovement(id: string): void {
      patchState(store, { cash: store.cash().filter((item) => item.id !== id) });
      notificationService.showSuccess('Movimiento eliminado.');
    },

    setExternalCash(movements: readonly CashMovement[]): void {
      patchState(store, { externalCash: movements.slice(0, CASH_MAX_RECORDS) });
    },

    setCashPeriod(period: CashPeriod): void {
      patchState(store, { filters: { ...store.filters(), period, page: 1 } });
    },

    setCashSearch(search: string): void {
      patchState(store, { filters: { ...store.filters(), search, page: 1 } });
    },

    setCashPage(page: number): void {
      patchState(store, { filters: { ...store.filters(), page: Math.max(1, page) } });
    },

    nextCashPage(): void {
      if (store.currentPage() < store.pageCount()) {
        patchState(store, { filters: { ...store.filters(), page: store.currentPage() + 1 } });
      }
    },

    previousCashPage(): void {
      if (store.currentPage() > 1) {
        patchState(store, { filters: { ...store.filters(), page: store.currentPage() - 1 } });
      }
    },

    resetCashFilters(): void {
      patchState(store, { filters: { period: 'mes', search: '', page: 1 } });
    },

    addPaymentMethod(payload: CreateCashPaymentMethodPayload): FinanceMutationResult {
      const method = createCashPaymentMethod(payload);
      if (!method) {
        return { ok: false, message: 'Indica el nombre del método de pago.' };
      }
      patchState(store, { methods: [...store.methods(), method] });
      notificationService.showSuccess('Método de pago agregado.');
      return { ok: true, method };
    },

    togglePaymentMethod(id: string): void {
      patchState(store, {
        methods: store
          .methods()
          .map((method) => (method.id === id ? { ...method, active: !method.active } : method)),
      });
    },

    removePaymentMethod(id: string): FinanceMutationResult {
      if (store.methods().length <= 1) {
        return { ok: false, message: 'Debe existir al menos un método de pago.' };
      }
      const used = store.movements().some((movement) => movement.paymentMethod === id);
      if (used) {
        return {
          ok: false,
          message: 'El método tiene movimientos asociados. Desactívalo en lugar de eliminarlo.',
        };
      }
      patchState(store, { methods: store.methods().filter((method) => method.id !== id) });
      notificationService.showSuccess('Método de pago eliminado.');
      return { ok: true };
    },

    addCashClosure(payload: CreateCashClosurePayload): FinanceMutationResult {
      const preview = store.closurePreview();
      if (preview.existing) {
        return { ok: false, message: 'Ya existe un cierre para esa fecha.' };
      }
      if (payload.date !== preview.date) {
        return { ok: false, message: 'Solo puedes cerrar la caja del día de hoy.' };
      }
      const closure = createCashClosure(preview, payload);
      if (!closure) {
        return { ok: false, message: 'Indica el monto contado en caja.' };
      }
      patchState(store, { closures: [closure, ...store.closures()] });
      notificationService.showSuccess('Cierre diario registrado.');
      return { ok: true, closure };
    },

    updatePettyFund(amount: number, responsible: string): FinanceMutationResult {
      const fund = createPettyCashFund(amount, responsible);
      if (!fund) {
        return { ok: false, message: 'El fondo de caja chica no puede ser negativo.' };
      }
      patchState(store, { pettyFund: fund });
      notificationService.showSuccess('Fondo de caja chica actualizado.');
      return { ok: true };
    },

    addPettyCashMovement(payload: CreatePettyCashMovementPayload): FinanceMutationResult {
      if (store.pettyMovements().length >= CASH_PETTY_MAX_RECORDS) {
        return { ok: false, message: 'Alcanzaste el límite de movimientos de caja chica.' };
      }
      const movement = createPettyCashMovement(payload);
      if (!movement) {
        return { ok: false, message: 'Revisa el concepto y el monto.' };
      }
      patchState(store, { pettyMovements: [movement, ...store.pettyMovements()] });
      notificationService.showSuccess(
        movement.type === 'gasto' ? 'Gasto de caja chica registrado.' : 'Reposición registrada.',
      );
      return { ok: true, pettyMovement: movement };
    },

    addCashTransfer(payload: CreateCashTransferPayload): FinanceMutationResult {
      const transfer = createCashTransfer(payload);
      if (!transfer) {
        return {
          ok: false,
          message: 'Revisa las cuentas, la fecha y el monto de la transferencia.',
        };
      }
      const linked = buildTransferCashMovements(transfer);
      patchState(store, {
        transfers: [transfer, ...store.transfers()],
        cash: [...linked, ...store.cash()],
      });
      notificationService.showSuccess('Transferencia registrada.');
      return { ok: true, transfer };
    },

    annulCashTransfer(id: string): FinanceMutationResult {
      const transfer = store.transfers().find((item) => item.id === id);
      if (!transfer) return { ok: false, message: 'La transferencia no existe.' };
      if (transfer.status === 'anulado') {
        return { ok: false, message: 'La transferencia ya está anulada.' };
      }
      patchState(store, {
        transfers: store
          .transfers()
          .map((item) => (item.id === id ? { ...item, status: 'anulado' as const } : item)),
        cash: store
          .cash()
          .map((movement) =>
            movement.transferId === id ? { ...movement, status: 'anulado' as const } : movement,
          ),
      });
      notificationService.showInfo('Transferencia anulada.');
      return { ok: true, transfer: { ...transfer, status: 'anulado' } };
    },

    reset(): void {
      patchState(store, { ...initialState, cash: store.cash() });
    },
  })),
  withHooks({
    onInit(store) {
      const authStore = inject(AuthStore);
      const tenantId = authStore.user()?.tenantId;
      const purchaseKey = financeStorageKey('purchases', tenantId);
      const expenseKey = financeStorageKey('expenses', tenantId);
      const cashKey = financeStorageKey('cash', tenantId);
      const methodsKey = financeStorageKey('cash-methods', tenantId);
      const closuresKey = financeStorageKey('cash-closures', tenantId);
      const pettyKey = financeStorageKey('cash-petty', tenantId);
      const pettyFundKey = financeStorageKey('cash-petty-fund', tenantId);
      const transfersKey = financeStorageKey('cash-transfers', tenantId);

      const purchases = readStored(purchaseKey, sanitizePurchaseRecords);
      const expenses = readStored(expenseKey, sanitizeExpenseRecords);
      const cash = readStored(cashKey, sanitizeCashMovements);
      const closures = readStored(closuresKey, sanitizeCashClosures);
      const pettyMovements = readStored(pettyKey, sanitizePettyCashMovements);
      const transfers = readStored(transfersKey, sanitizeCashTransfers);
      const pettyFund = readStoredObject(pettyFundKey, sanitizePettyCashFund);
      const storedMethods = readStored(methodsKey, sanitizeCashPaymentMethods);
      const methods = hasStored(methodsKey) ? storedMethods : seedCashPaymentMethods();

      patchState(store, {
        purchases,
        expenses,
        cash,
        closures,
        pettyMovements,
        transfers,
        methods,
        ...(pettyFund ? { pettyFund } : {}),
      });

      effect(() => persist(purchaseKey, store.purchases()));
      effect(() => persist(expenseKey, store.expenses()));
      effect(() => persist(cashKey, store.cash()));
      effect(() => persist(methodsKey, store.methods()));
      effect(() => persist(closuresKey, store.closures()));
      effect(() => persist(pettyKey, store.pettyMovements()));
      effect(() => persist(pettyFundKey, store.pettyFund()));
      effect(() => persist(transfersKey, store.transfers()));
    },
  }),
);
