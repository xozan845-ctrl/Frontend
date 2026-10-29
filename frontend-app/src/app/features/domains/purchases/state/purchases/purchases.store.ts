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
  buildPurchaseHistoryRows,
  buildPurchaseOrderRows,
  buildSupplierRows,
  computePurchaseKpis,
  createDirectPurchaseRecord,
  createNewProductPurchaseRecord,
  createPurchaseOrder,
  createPurchaseRecord,
  createSupplier,
  filterPurchaseRecords,
  migrateFinancePurchases,
  nextDocumentNumber,
  normalizePurchaseText,
  purchasePageCount,
  purchaseToday,
  sanitizePurchaseDocumentSettings,
  sanitizePurchaseOrders,
  sanitizePurchaseRecords,
  sanitizeSuppliers,
} from '../../adapters/purchases/purchases.adapter';
import {
  DEFAULT_PURCHASE_DOCUMENT_SETTINGS,
  legacyFinancePurchasesKey,
  PURCHASE_HISTORY_PAGE_SIZE,
  PURCHASE_MAX_RECORDS,
  PURCHASE_MAX_SUPPLIERS,
  purchaseStorageKey,
} from '../../constants/purchases.constants';
import type {
  CreateDirectPurchaseInput,
  CreateNewProductPurchaseInput,
  CreateOrderInput,
  CreatePurchaseInput,
  CreateSupplierInput,
  PurchaseDocumentSettings,
  PurchaseMutationResult,
  PurchasePeriod,
  PurchaseStatusFilter,
  Supplier,
} from '../../models/purchase.model';
import type { PurchasesState } from './purchases.state';

const initialState: PurchasesState = {
  records: [],
  orders: [],
  suppliers: [],
  documentSettings: { ...DEFAULT_PURCHASE_DOCUMENT_SETTINGS },
  query: '',
  period: 'mes',
  customFrom: '',
  customTo: '',
  status: 'todas',
  page: 1,
};

function readStored(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as unknown) : null;
  } catch {
    return null;
  }
}

function persist(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage no disponible: los documentos viven solo en memoria.
  }
}

function toText(value: string | null | undefined): string {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * Compras de la empresa (ADR-66): historial, órdenes de compra, proveedores y
 * preferencias de documentos. La persistencia es local por tenant hasta que el
 * API exponga los endpoints de compras; los derivados viven en `withComputed`
 * (`R-ST-3`).
 */
export const PurchasesStore = signalStore(
  withState(initialState),
  withComputed((store) => {
    const filteredRecords = computed(() =>
      filterPurchaseRecords(store.records(), {
        period: store.period(),
        customFrom: store.customFrom(),
        customTo: store.customTo(),
        status: store.status(),
        query: store.query(),
      }),
    );
    const pageCount = computed(() => purchasePageCount(filteredRecords().length));
    const currentPage = computed(() => Math.min(Math.max(1, store.page()), pageCount()));

    return {
      filteredRecords,
      historyRows: computed(() => buildPurchaseHistoryRows(filteredRecords())),
      filteredCount: computed(() => filteredRecords().length),
      pageCount,
      currentPage,
      pagedRows: computed(() =>
        buildPurchaseHistoryRows(filteredRecords()).slice(
          (currentPage() - 1) * PURCHASE_HISTORY_PAGE_SIZE,
          currentPage() * PURCHASE_HISTORY_PAGE_SIZE,
        ),
      ),
      kpis: computed(() => computePurchaseKpis(store.records())),
      supplierRows: computed(() => buildSupplierRows(store.suppliers(), store.records())),
      orderRows: computed(() => buildPurchaseOrderRows(store.orders())),
      orderCount: computed(() => store.orders().length),
      nextPurchaseNumber: computed(() => nextDocumentNumber(store.records(), 'C')),
      nextOrderNumber: computed(() => nextDocumentNumber(store.orders(), 'OC')),
      hasRecords: computed(() => store.records().length > 0),
      hasFilteredRecords: computed(() => filteredRecords().length > 0),
      hasSuppliers: computed(() => store.suppliers().length > 0),
      hasOrders: computed(() => store.orders().length > 0),
      isCustomPeriod: computed(() => store.period() === 'personalizado'),
      isFirstPage: computed(() => currentPage() === 1),
      isLastPage: computed(() => currentPage() >= pageCount()),
    };
  }),
  withMethods((store, notificationService = inject(NotificationService)) => {
    const ensureSupplier = (
      supplierId?: string | null,
      supplierName?: string | null,
    ): Supplier | null => {
      const id = toText(supplierId);
      if (id) {
        const byId = store.suppliers().find((supplier) => supplier.id === id);
        if (byId) return byId;
      }
      const name = toText(supplierName);
      if (!name) return null;
      const byName = store
        .suppliers()
        .find((supplier) => normalizePurchaseText(supplier.name) === normalizePurchaseText(name));
      if (byName) return byName;
      if (store.suppliers().length >= PURCHASE_MAX_SUPPLIERS) return null;
      const created = createSupplier({ name });
      if (!created) return null;
      patchState(store, { suppliers: [created, ...store.suppliers()] });
      return created;
    };

    const canAddRecord = (): boolean => store.records().length < PURCHASE_MAX_RECORDS;

    return {
      addPurchase(input: CreatePurchaseInput): PurchaseMutationResult {
        if (!canAddRecord()) {
          return { ok: false, message: 'Alcanzaste el límite de compras guardadas.' };
        }
        const supplier = ensureSupplier(input.supplierId, input.supplierName);
        const record = createPurchaseRecord(
          {
            ...input,
            supplierId: supplier?.id ?? input.supplierId ?? null,
            supplierName: supplier?.name ?? input.supplierName ?? '',
          },
          store.nextPurchaseNumber(),
        );
        if (!record) {
          return {
            ok: false,
            message: 'Revisa el proveedor, las líneas y el total de la compra.',
          };
        }
        patchState(store, { records: [record, ...store.records()], page: 1 });
        notificationService.showSuccess(`Compra ${record.number} registrada.`);
        return { ok: true };
      },

      addDirectPurchase(input: CreateDirectPurchaseInput): PurchaseMutationResult {
        if (!canAddRecord()) {
          return { ok: false, message: 'Alcanzaste el límite de compras guardadas.' };
        }
        const supplier = ensureSupplier(input.supplierId, input.supplierName);
        const record = createDirectPurchaseRecord(
          {
            ...input,
            supplierId: supplier?.id ?? input.supplierId ?? null,
            supplierName: supplier?.name ?? input.supplierName ?? '',
          },
          store.nextPurchaseNumber(),
        );
        if (!record) {
          return { ok: false, message: 'Revisa el concepto, el monto y la fecha.' };
        }
        patchState(store, { records: [record, ...store.records()], page: 1 });
        notificationService.showSuccess('Compra directa registrada.');
        return { ok: true };
      },

      addNewProductPurchase(input: CreateNewProductPurchaseInput): PurchaseMutationResult {
        if (!canAddRecord()) {
          return { ok: false, message: 'Alcanzaste el límite de compras guardadas.' };
        }
        const supplier = ensureSupplier(input.supplierId, input.supplierName);
        const record = createNewProductPurchaseRecord(
          {
            ...input,
            supplierId: supplier?.id ?? input.supplierId ?? null,
            supplierName: supplier?.name ?? input.supplierName ?? '',
          },
          store.nextPurchaseNumber(),
        );
        if (!record) {
          return { ok: false, message: 'Revisa el producto, el costo, el precio y la cantidad.' };
        }
        patchState(store, { records: [record, ...store.records()], page: 1 });
        notificationService.showSuccess('Producto comprado y agregado al inventario.');
        return { ok: true };
      },

      addOrder(input: CreateOrderInput): PurchaseMutationResult {
        if (store.orders().length >= PURCHASE_MAX_RECORDS) {
          return { ok: false, message: 'Alcanzaste el límite de órdenes guardadas.' };
        }
        const supplier = ensureSupplier(input.supplierId, input.supplierName);
        const order = createPurchaseOrder(
          {
            ...input,
            supplierId: supplier?.id ?? input.supplierId ?? null,
            supplierName: supplier?.name ?? input.supplierName ?? '',
          },
          store.nextOrderNumber(),
        );
        if (!order) {
          return { ok: false, message: 'Agrega al menos un producto con costo a la orden.' };
        }
        patchState(store, { orders: [order, ...store.orders()] });
        notificationService.showSuccess(`Orden ${order.number} creada.`);
        return { ok: true };
      },

      convertOrderToPurchase(id: string): PurchaseMutationResult {
        const order = store.orders().find((item) => item.id === id);
        if (!order || order.status !== 'pendiente') {
          return { ok: false, message: 'La orden ya no está pendiente.' };
        }
        if (!canAddRecord()) {
          return { ok: false, message: 'Alcanzaste el límite de compras guardadas.' };
        }
        const supplier = ensureSupplier(order.supplierId, order.supplierName);
        const record = createPurchaseRecord(
          {
            date: purchaseToday(),
            supplierId: supplier?.id ?? order.supplierId,
            supplierName: supplier?.name ?? order.supplierName,
            paymentMethod: 'efectivo',
            status: 'pendiente',
            origin: 'productos',
            costType: 'inventario',
            lines: order.lines,
            notes: `Convertida desde la orden ${order.number}.`,
          },
          store.nextPurchaseNumber(),
        );
        if (!record) {
          return { ok: false, message: 'No se pudo convertir la orden en compra.' };
        }
        patchState(store, {
          records: [record, ...store.records()],
          orders: store
            .orders()
            .map((item) => (item.id === id ? { ...item, status: 'convertida' } : item)),
          page: 1,
        });
        notificationService.showSuccess(`Orden ${order.number} convertida en compra.`);
        return { ok: true };
      },

      cancelOrder(id: string): void {
        patchState(store, {
          orders: store
            .orders()
            .map((item) =>
              item.id === id && item.status === 'pendiente' ? { ...item, status: 'anulada' } : item,
            ),
        });
        notificationService.showSuccess('Orden anulada.');
      },

      cancelPurchase(id: string): void {
        patchState(store, {
          records: store
            .records()
            .map((record) => (record.id === id ? { ...record, status: 'anulada' } : record)),
        });
        notificationService.showSuccess('Compra anulada.');
      },

      removePurchase(id: string): void {
        patchState(store, { records: store.records().filter((record) => record.id !== id) });
        notificationService.showSuccess('Compra eliminada.');
      },

      addSupplier(input: CreateSupplierInput): PurchaseMutationResult {
        if (store.suppliers().length >= PURCHASE_MAX_SUPPLIERS) {
          return { ok: false, message: 'Alcanzaste el límite de proveedores.' };
        }
        const supplier = createSupplier(input);
        if (!supplier) {
          return { ok: false, message: 'Indica el nombre del proveedor.' };
        }
        const exists = store
          .suppliers()
          .some(
            (item) => normalizePurchaseText(item.name) === normalizePurchaseText(supplier.name),
          );
        if (exists) {
          return { ok: false, message: 'Ya existe un proveedor con ese nombre.' };
        }
        patchState(store, { suppliers: [supplier, ...store.suppliers()] });
        notificationService.showSuccess(`Proveedor "${supplier.name}" registrado.`);
        return { ok: true };
      },

      updateDocumentSettings(settings: PurchaseDocumentSettings): void {
        patchState(store, {
          documentSettings: sanitizePurchaseDocumentSettings(settings),
        });
        notificationService.showSuccess('Preferencias de documentos guardadas.');
      },

      setQuery(query: string): void {
        patchState(store, { query, page: 1 });
      },

      setPeriod(period: PurchasePeriod): void {
        patchState(store, { period, page: 1 });
      },

      setCustomFrom(customFrom: string): void {
        patchState(store, { customFrom, period: 'personalizado', page: 1 });
      },

      setCustomTo(customTo: string): void {
        patchState(store, { customTo, period: 'personalizado', page: 1 });
      },

      setStatus(status: PurchaseStatusFilter): void {
        patchState(store, { status, page: 1 });
      },

      setPage(page: number): void {
        patchState(store, { page: Math.max(1, Math.trunc(page)) });
      },

      nextPage(): void {
        if (store.currentPage() < store.pageCount()) {
          patchState(store, { page: store.currentPage() + 1 });
        }
      },

      previousPage(): void {
        if (store.currentPage() > 1) {
          patchState(store, { page: store.currentPage() - 1 });
        }
      },

      clearFilters(): void {
        patchState(store, { query: '', period: 'mes', status: 'todas', page: 1 });
      },

      reset(): void {
        patchState(store, { ...initialState });
      },
    };
  }),
  withHooks({
    onInit(store) {
      const authStore = inject(AuthStore);
      const tenantId = authStore.user()?.tenantId;
      const recordsKey = purchaseStorageKey('records', tenantId);
      const ordersKey = purchaseStorageKey('orders', tenantId);
      const suppliersKey = purchaseStorageKey('suppliers', tenantId);
      const documentKey = purchaseStorageKey('document', tenantId);

      let records = sanitizePurchaseRecords(readStored(recordsKey));
      if (records.length === 0) {
        records = migrateFinancePurchases(readStored(legacyFinancePurchasesKey(tenantId)));
      }
      const orders = sanitizePurchaseOrders(readStored(ordersKey));
      let suppliers = sanitizeSuppliers(readStored(suppliersKey));

      if (suppliers.length === 0 && records.length > 0) {
        const seen = new Set<string>();
        const derived: Supplier[] = [];
        for (const record of records) {
          const key = normalizePurchaseText(record.supplierName);
          if (!key || key === 'sin proveedor' || seen.has(key)) continue;
          const supplier = createSupplier({
            name: record.supplierName,
            ruc: '',
            phone: '',
            email: '',
            address: '',
          });
          if (!supplier) continue;
          seen.add(key);
          derived.push(supplier);
        }
        suppliers = derived;
      }

      const documentSettings = sanitizePurchaseDocumentSettings(readStored(documentKey));

      patchState(store, {
        records,
        orders,
        suppliers,
        documentSettings,
      });

      effect(() => persist(recordsKey, store.records()));
      effect(() => persist(ordersKey, store.orders()));
      effect(() => persist(suppliersKey, store.suppliers()));
      effect(() => persist(documentKey, store.documentSettings()));
    },
  }),
);
