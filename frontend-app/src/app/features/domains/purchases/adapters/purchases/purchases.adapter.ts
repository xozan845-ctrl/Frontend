import {
  DEFAULT_PURCHASE_DOCUMENT_SETTINGS,
  PURCHASE_HISTORY_PAGE_SIZE,
  PURCHASE_ORDER_STATUS_LABELS,
  PURCHASE_PAYMENT_LABELS,
  PURCHASE_PERIODS,
  PURCHASE_STATUS_LABELS,
} from '../../constants/purchases.constants';
import type {
  CreateDirectPurchaseInput,
  CreateNewProductPurchaseInput,
  CreateOrderInput,
  CreatePurchaseInput,
  CreateSupplierInput,
  PurchaseCostType,
  PurchaseDocumentSettings,
  PurchaseFilters,
  PurchaseHistoryRow,
  PurchaseKpis,
  PurchaseLine,
  PurchaseLineInput,
  PurchaseOrder,
  PurchaseOrderStatus,
  PurchaseOrderRow,
  PurchaseOrigin,
  PurchasePaymentMethod,
  PurchasePeriod,
  PurchaseRecord,
  PurchaseReport,
  PurchaseReportOptions,
  PurchaseStatus,
  PurchaseStatusFilter,
  Supplier,
  SupplierRow,
} from '../../models/purchase.model';

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const PURCHASE_STATUS_VALUES: readonly PurchaseStatus[] = ['recibida', 'pendiente', 'anulada'];
const ORDER_STATUS_VALUES: readonly PurchaseOrderStatus[] = ['pendiente', 'convertida', 'anulada'];
const PAYMENT_VALUES: readonly PurchasePaymentMethod[] = [
  'efectivo',
  'tarjeta',
  'transferencia',
  'credito',
  'otro',
];
const COST_TYPE_VALUES: readonly PurchaseCostType[] = ['inventario', 'servicio', 'gasto', 'otro'];
const ORIGIN_VALUES: readonly PurchaseOrigin[] = ['productos', 'directa'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function toText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function toNumber(value: unknown): number {
  const parsed =
    typeof value === 'string' ? Number(value.trim().replace(',', '.')) : (value as number);
  return typeof parsed === 'number' && Number.isFinite(parsed) ? parsed : 0;
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function toDate(value: unknown): string {
  const text = toText(value);
  if (!DATE_ONLY.test(text)) return '';
  const date = new Date(`${text}T12:00:00`);
  return Number.isNaN(date.getTime()) ? '' : text;
}

function toIso(value: unknown, fallback: string): string {
  if (typeof value !== 'string' || !value.trim()) return fallback;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? fallback : new Date(parsed).toISOString();
}

function includes<T extends string>(values: readonly T[], value: unknown): value is T {
  return typeof value === 'string' && values.includes(value as T);
}

/** Genera un id estable para documentos y líneas. */
export function createPurchaseId(prefix = 'purchase'): string {
  const random = globalThis.crypto?.randomUUID?.();
  if (random) return `${prefix}-${random}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Normaliza texto para comparar proveedores y búsquedas. */
export function normalizePurchaseText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/** Fecha local de hoy en `yyyy-mm-dd`. */
export function purchaseToday(now: Date = new Date()): string {
  return toDateKey(now);
}

function toDateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function startOfWeek(now: Date): Date {
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const mondayOffset = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - mondayOffset);
  return date;
}

function isValidMoney(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

/** Convierte una línea capturada por la UI en una línea persistible. */
export function createPurchaseLine(input: PurchaseLineInput): PurchaseLine | null {
  const name = toText(input.name);
  const quantity = round2(toNumber(input.quantity));
  const unitCost = round2(toNumber(input.unitCost));
  if (!name || quantity <= 0 || unitCost < 0) return null;
  return {
    id: createPurchaseId('line'),
    productId: toText(input.productId) || null,
    name,
    sku: toText(input.sku),
    quantity,
    unitCost,
    salePrice:
      typeof input.salePrice === 'number' &&
      Number.isFinite(input.salePrice) &&
      input.salePrice >= 0
        ? round2(input.salePrice)
        : null,
  };
}

function normalizeLines(inputs: readonly PurchaseLineInput[]): PurchaseLine[] {
  return inputs.map(createPurchaseLine).filter((line): line is PurchaseLine => line !== null);
}

function sumLines(lines: readonly PurchaseLine[]): number {
  return round2(lines.reduce((total, line) => total + line.quantity * line.unitCost, 0));
}

/** Siguiente número correlativo (`C-0001`, `OC-0002`…). */
export function nextDocumentNumber(
  records: readonly { number: string }[],
  prefix: 'C' | 'OC',
): string {
  const pattern = new RegExp(`^${prefix}-(\\d+)$`);
  let max = 0;
  for (const record of records) {
    const match = pattern.exec(record.number);
    if (!match) continue;
    const value = Number(match[1]);
    if (Number.isFinite(value)) max = Math.max(max, value);
  }
  return `${prefix}-${String(max + 1).padStart(4, '0')}`;
}

/** Construye una compra validada a partir del asistente. */
export function createPurchaseRecord(
  input: CreatePurchaseInput,
  number: string,
): PurchaseRecord | null {
  const date = toDate(input.date);
  const lines = normalizeLines(input.lines);
  const subtotal = sumLines(lines);
  if (!date || lines.length === 0 || !isValidMoney(subtotal)) return null;
  if (!includes(PURCHASE_STATUS_VALUES, input.status)) return null;
  if (!includes(ORIGIN_VALUES, input.origin)) return null;
  if (!includes(COST_TYPE_VALUES, input.costType)) return null;
  if (!includes(PAYMENT_VALUES, input.paymentMethod)) return null;

  const retention = Math.min(
    Math.max(0, round2(toNumber(input.retention))),
    round2(subtotal * 0.3),
  );
  return {
    id: createPurchaseId('purchase'),
    number,
    date,
    supplierId: toText(input.supplierId) || null,
    supplierName: toText(input.supplierName) || 'Sin proveedor',
    paymentMethod: input.paymentMethod,
    status: input.status,
    origin: input.origin,
    costType: input.costType,
    lines,
    subtotal,
    retention,
    total: subtotal,
    notes: toText(input.notes),
    userName: toText(input.userName),
    createdAt: new Date().toISOString(),
  };
}

/** Compra desde el formulario de compra directa (gasto no inventariable). */
export function createDirectPurchaseRecord(
  input: CreateDirectPurchaseInput,
  number: string,
): PurchaseRecord | null {
  const concept = toText(input.concept);
  const amount = round2(toNumber(input.amount));
  if (!concept || !isValidMoney(amount)) return null;
  return createPurchaseRecord(
    {
      date: input.date,
      supplierId: input.supplierId,
      supplierName: input.supplierName,
      paymentMethod: input.paymentMethod,
      status: 'recibida',
      origin: 'directa',
      costType: includes(COST_TYPE_VALUES, input.costType) ? input.costType : 'gasto',
      lines: [
        {
          productId: null,
          name: concept,
          quantity: 1,
          unitCost: amount,
        },
      ],
      notes: input.notes,
      retention: input.retention,
      userName: input.userName,
    },
    number,
  );
}

/** Compra de un producto nuevo que se agrega al inventario. */
export function createNewProductPurchaseRecord(
  input: CreateNewProductPurchaseInput,
  number: string,
): PurchaseRecord | null {
  const productName = toText(input.productName);
  const unitCost = round2(toNumber(input.unitCost));
  const salePrice = round2(toNumber(input.salePrice));
  const quantity = Math.max(1, Math.trunc(toNumber(input.quantity)));
  if (!productName || !isValidMoney(unitCost) || !isValidMoney(salePrice)) return null;
  return createPurchaseRecord(
    {
      date: input.date,
      supplierId: input.supplierId,
      supplierName: input.supplierName,
      paymentMethod: input.paymentMethod,
      status: 'recibida',
      origin: 'productos',
      costType: 'inventario',
      lines: [
        {
          productId: null,
          name: productName,
          sku: toText(input.sku),
          quantity,
          unitCost,
          salePrice,
        },
      ],
      notes: [toText(input.category), toText(input.notes)].filter(Boolean).join(' · '),
      userName: input.userName,
    },
    number,
  );
}

/** Orden de compra validada (no afecta caja ni inventario). */
export function createPurchaseOrder(input: CreateOrderInput, number: string): PurchaseOrder | null {
  const date = toDate(input.date);
  const lines = normalizeLines(input.lines);
  const total = sumLines(lines);
  if (!date || lines.length === 0 || !isValidMoney(total)) return null;
  return {
    id: createPurchaseId('order'),
    number,
    date,
    supplierId: toText(input.supplierId) || null,
    supplierName: toText(input.supplierName) || 'Sin proveedor',
    lines,
    total,
    status: 'pendiente',
    notes: toText(input.notes),
    createdAt: new Date().toISOString(),
  };
}

/** Proveedor validado. */
export function createSupplier(input: CreateSupplierInput): Supplier | null {
  const name = toText(input.name);
  if (!name) return null;
  return {
    id: createPurchaseId('supplier'),
    name,
    ruc: toText(input.ruc),
    phone: toText(input.phone),
    email: toText(input.email),
    address: toText(input.address),
    createdAt: new Date().toISOString(),
  };
}

function adaptLine(raw: Record<string, unknown>): PurchaseLine | null {
  const name = toText(raw['name']);
  const quantity = round2(toNumber(raw['quantity']));
  const unitCost = round2(toNumber(raw['unitCost']));
  if (!name || quantity <= 0 || unitCost < 0) return null;
  return {
    id: toText(raw['id']) || createPurchaseId('line'),
    productId: toText(raw['productId']) || null,
    name,
    sku: toText(raw['sku']),
    quantity,
    unitCost,
    salePrice:
      raw['salePrice'] === null || raw['salePrice'] === undefined
        ? null
        : round2(toNumber(raw['salePrice'])),
  };
}

function adaptLines(value: unknown): PurchaseLine[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (isRecord(item) ? adaptLine(item) : null))
    .filter((line): line is PurchaseLine => line !== null);
}

function adaptPurchase(raw: Record<string, unknown>): PurchaseRecord | null {
  const id = toText(raw['id']);
  const number = toText(raw['number']);
  const date = toDate(raw['date']);
  const lines = adaptLines(raw['lines']);
  const subtotal = sumLines(lines);
  if (!id || !number || !date || lines.length === 0 || !isValidMoney(subtotal)) return null;
  const status = includes(PURCHASE_STATUS_VALUES, raw['status']) ? raw['status'] : 'recibida';
  const paymentMethod = includes(PAYMENT_VALUES, raw['paymentMethod'])
    ? raw['paymentMethod']
    : 'efectivo';
  const origin = includes(ORIGIN_VALUES, raw['origin']) ? raw['origin'] : 'productos';
  const costType = includes(COST_TYPE_VALUES, raw['costType']) ? raw['costType'] : 'inventario';
  const retention = Math.min(
    Math.max(0, round2(toNumber(raw['retention']))),
    round2(subtotal * 0.3),
  );
  return {
    id,
    number,
    date,
    supplierId: toText(raw['supplierId']) || null,
    supplierName: toText(raw['supplierName']) || 'Sin proveedor',
    paymentMethod,
    status,
    origin,
    costType,
    lines,
    subtotal,
    retention,
    total: subtotal,
    notes: toText(raw['notes']),
    userName: toText(raw['userName']),
    createdAt: toIso(raw['createdAt'], `${date}T12:00:00.000Z`),
  };
}

function adaptOrder(raw: Record<string, unknown>): PurchaseOrder | null {
  const id = toText(raw['id']);
  const number = toText(raw['number']);
  const date = toDate(raw['date']);
  const lines = adaptLines(raw['lines']);
  const total = sumLines(lines);
  if (!id || !number || !date || lines.length === 0 || !isValidMoney(total)) return null;
  return {
    id,
    number,
    date,
    supplierId: toText(raw['supplierId']) || null,
    supplierName: toText(raw['supplierName']) || 'Sin proveedor',
    lines,
    total,
    status: includes(ORDER_STATUS_VALUES, raw['status']) ? raw['status'] : 'pendiente',
    notes: toText(raw['notes']),
    createdAt: toIso(raw['createdAt'], `${date}T12:00:00.000Z`),
  };
}

function adaptSupplier(raw: Record<string, unknown>): Supplier | null {
  const id = toText(raw['id']);
  const name = toText(raw['name']);
  if (!id || !name) return null;
  return {
    id,
    name,
    ruc: toText(raw['ruc']),
    phone: toText(raw['phone']),
    email: toText(raw['email']),
    address: toText(raw['address']),
    createdAt: toIso(raw['createdAt'], new Date(0).toISOString()),
  };
}

function sanitizeList<T>(
  value: unknown,
  adapt: (item: Record<string, unknown>) => T | null,
  limit: number,
): T[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (isRecord(item) ? adapt(item) : null))
    .filter((item): item is T => item !== null)
    .slice(0, limit);
}

/** Normaliza las compras persistidas. */
export function sanitizePurchaseRecords(value: unknown): PurchaseRecord[] {
  return sanitizeList(value, adaptPurchase, 1_000);
}

/** Normaliza las órdenes persistidas. */
export function sanitizePurchaseOrders(value: unknown): PurchaseOrder[] {
  return sanitizeList(value, adaptOrder, 1_000);
}

/** Normaliza los proveedores persistidos. */
export function sanitizeSuppliers(value: unknown): Supplier[] {
  return sanitizeList(value, adaptSupplier, 500);
}

/** Normaliza las preferencias de documentos. */
export function sanitizePurchaseDocumentSettings(raw: unknown): PurchaseDocumentSettings {
  if (!isRecord(raw)) return { ...DEFAULT_PURCHASE_DOCUMENT_SETTINGS };
  const color = toText(raw['headerColor']);
  return {
    logoSize:
      raw['logoSize'] === 'pequeno' || raw['logoSize'] === 'grande' || raw['logoSize'] === 'mediano'
        ? raw['logoSize']
        : DEFAULT_PURCHASE_DOCUMENT_SETTINGS.logoSize,
    headerColor: /^#[0-9a-fA-F]{6}$/.test(color)
      ? color.toUpperCase()
      : DEFAULT_PURCHASE_DOCUMENT_SETTINGS.headerColor,
    matchTableColor: raw['matchTableColor'] !== false,
    footerMessage: toText(raw['footerMessage']).slice(0, 240),
    showRuc: raw['showRuc'] !== false,
    showAddress: raw['showAddress'] !== false,
    showPhone: raw['showPhone'] !== false,
  };
}

/**
 * Migra las compras simples que guardaba el módulo de finanzas para que el
 * historial nuevo arranque con los registros ya existentes.
 */
export function migrateFinancePurchases(value: unknown): PurchaseRecord[] {
  if (!Array.isArray(value)) return [];
  const result: PurchaseRecord[] = [];
  value.forEach((item, index) => {
    if (!isRecord(item)) return;
    const date = toDate(item['date']);
    const supplierName = toText(item['supplier']) || 'Sin proveedor';
    const concept = toText(item['concept']) || 'Compra registrada';
    const amount = round2(toNumber(item['amount']));
    if (!date || !isValidMoney(amount)) return;
    const status: PurchaseStatus =
      item['status'] === 'pagada'
        ? 'recibida'
        : item['status'] === 'pendiente'
          ? 'pendiente'
          : 'recibida';
    result.push({
      id: toText(item['id']) || createPurchaseId('purchase'),
      number: `C-${String(index + 1).padStart(4, '0')}`,
      date,
      supplierId: null,
      supplierName,
      paymentMethod: 'efectivo',
      status,
      origin: 'productos',
      costType: 'inventario',
      lines: [
        {
          id: createPurchaseId('line'),
          productId: null,
          name: concept,
          sku: '',
          quantity: 1,
          unitCost: amount,
          salePrice: null,
        },
      ],
      subtotal: amount,
      retention: 0,
      total: amount,
      notes: '',
      userName: '',
      createdAt: `${date}T12:00:00.000Z`,
    });
  });
  return result;
}

/** Indica si una fecha cae dentro del periodo elegido. */
export function isPurchaseInPeriod(
  date: string,
  period: PurchasePeriod,
  customFrom: string,
  customTo: string,
  now: Date = new Date(),
): boolean {
  if (!DATE_ONLY.test(date)) return false;
  if (period === 'hoy') return date === toDateKey(now);
  if (period === 'semana') {
    const start = toDateKey(startOfWeek(now));
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    end.setDate(end.getDate() + 6);
    return date >= start && date <= toDateKey(end);
  }
  if (period === 'mes')
    return date.startsWith(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  if (period === 'año') return date.startsWith(`${now.getFullYear()}-`);
  const from = toDate(customFrom);
  const to = toDate(customTo);
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}

function matchesStatus(
  record: PurchaseRecord,
  status: 'todas' | 'activas' | 'anuladas' | PurchaseStatusFilter,
): boolean {
  if (status === 'todas') return true;
  if (status === 'activas') return record.status !== 'anulada';
  if (status === 'anuladas') return record.status === 'anulada';
  return record.status === status;
}

function matchesType(record: PurchaseRecord, type: 'todas' | 'productos' | 'directas'): boolean {
  if (type === 'todas') return true;
  if (type === 'productos') return record.origin === 'productos';
  return record.origin === 'directa';
}

function matchesQuery(record: PurchaseRecord, query: string): boolean {
  const needle = normalizePurchaseText(query);
  if (!needle) return true;
  const haystack = normalizePurchaseText(
    [
      record.number,
      record.supplierName,
      record.notes,
      record.userName,
      ...record.lines.map((line) => `${line.name} ${line.sku}`),
    ].join(' '),
  );
  return haystack.includes(needle);
}

/** Aplica periodo, estado, tipo, pago, proveedores y búsqueda. */
export function filterPurchaseRecords(
  records: readonly PurchaseRecord[],
  filters: PurchaseFilters,
): PurchaseRecord[] {
  const supplierIds = new Set((filters.supplierIds ?? []).filter(Boolean));
  const supplierNames = new Set(
    (filters.supplierNames ?? []).map((name) => normalizePurchaseText(name)).filter(Boolean),
  );
  return records.filter((record) => {
    if (
      !isPurchaseInPeriod(
        record.date,
        filters.period,
        filters.customFrom ?? '',
        filters.customTo ?? '',
        filters.now,
      )
    ) {
      return false;
    }
    if (!matchesStatus(record, filters.status ?? 'todas')) return false;
    if (!matchesType(record, filters.type ?? 'todas')) return false;
    if (
      filters.payment &&
      filters.payment !== 'todas' &&
      record.paymentMethod !== filters.payment
    ) {
      return false;
    }
    if (
      (supplierIds.size > 0 || supplierNames.size > 0) &&
      !(record.supplierId && supplierIds.has(record.supplierId)) &&
      !supplierNames.has(normalizePurchaseText(record.supplierName))
    ) {
      return false;
    }
    return matchesQuery(record, filters.query ?? '');
  });
}

/** KPIs de la cabecera de compras. */
export function computePurchaseKpis(
  records: readonly PurchaseRecord[],
  now: Date = new Date(),
): PurchaseKpis {
  const today = toDateKey(now);
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  let todayTotal = 0;
  let todayCount = 0;
  let monthTotal = 0;
  let monthCount = 0;
  let totalCount = 0;
  let cancelledCount = 0;
  let productsEntered = 0;
  let inventoryInvestment = 0;
  const activeSupplierKeys = new Set<string>();

  for (const record of records) {
    if (record.status === 'anulada') {
      cancelledCount += 1;
      continue;
    }
    totalCount += 1;
    if (record.date === today) {
      todayTotal += record.total;
      todayCount += 1;
    }
    if (record.date.startsWith(monthPrefix)) {
      monthTotal += record.total;
      monthCount += 1;
    }
    if (record.origin === 'productos') {
      inventoryInvestment += record.total;
      for (const line of record.lines) productsEntered += line.quantity;
    }
    if (record.supplierName !== 'Sin proveedor') {
      activeSupplierKeys.add(record.supplierId ?? normalizePurchaseText(record.supplierName));
    }
  }

  return {
    todayTotal: round2(todayTotal),
    todayCount,
    monthTotal: round2(monthTotal),
    monthCount,
    totalCount,
    cancelledCount,
    productsEntered: round2(productsEntered),
    inventoryInvestment: round2(inventoryInvestment),
    activeSuppliers: activeSupplierKeys.size,
  };
}

/** Filas del historial, ordenadas de la más reciente a la más antigua. */
export function buildPurchaseHistoryRows(records: readonly PurchaseRecord[]): PurchaseHistoryRow[] {
  return [...records]
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
    .map((record) => {
      const first = record.lines[0];
      const productsLabel = first
        ? record.lines.length > 1
          ? `${first.name} +${record.lines.length - 1}`
          : first.name
        : '—';
      return {
        id: record.id,
        number: record.number,
        date: record.date,
        supplierName: record.supplierName,
        productsLabel,
        units: round2(record.lines.reduce((total, line) => total + line.quantity, 0)),
        total: record.total,
        paymentLabel: PURCHASE_PAYMENT_LABELS[record.paymentMethod],
        status: record.status,
        statusLabel: PURCHASE_STATUS_LABELS[record.status],
        userName: record.userName || '—',
        isCancelled: record.status === 'anulada',
      };
    });
}

/** Filas de proveedores con número de compras, total y última fecha. */
export function buildSupplierRows(
  suppliers: readonly Supplier[],
  records: readonly PurchaseRecord[],
): SupplierRow[] {
  const rows: SupplierRow[] = [];
  const known = new Set<string>();

  const pushRow = (supplier: Supplier): void => {
    const key = normalizePurchaseText(supplier.name);
    known.add(key);
    const matching = records.filter(
      (record) =>
        record.status !== 'anulada' &&
        (record.supplierId === supplier.id ||
          normalizePurchaseText(record.supplierName) === normalizePurchaseText(supplier.name)),
    );
    const total = round2(matching.reduce((sum, record) => sum + record.total, 0));
    const lastPurchaseDate =
      matching.map((record) => record.date).sort((a, b) => b.localeCompare(a))[0] ?? '';
    rows.push({
      id: supplier.id,
      name: supplier.name,
      ruc: supplier.ruc,
      contact: supplier.phone || supplier.email || '—',
      purchaseCount: matching.length,
      total,
      lastPurchaseDate,
    });
  };

  for (const supplier of suppliers) pushRow(supplier);

  const derived = new Map<string, Supplier>();
  for (const record of records) {
    if (record.status === 'anulada' || record.supplierName === 'Sin proveedor') continue;
    const key = normalizePurchaseText(record.supplierName);
    if (known.has(key) || derived.has(key)) continue;
    derived.set(key, {
      id: record.supplierId ?? `supplier-name-${key}`,
      name: record.supplierName,
      ruc: '',
      phone: '',
      email: '',
      address: '',
      createdAt: record.createdAt,
    });
  }
  for (const supplier of derived.values()) pushRow(supplier);

  return rows.sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

/** Filas de órdenes de compra. */
export function buildPurchaseOrderRows(orders: readonly PurchaseOrder[]): PurchaseOrderRow[] {
  return [...orders]
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
    .map((order) => {
      const first = order.lines[0];
      return {
        id: order.id,
        number: order.number,
        date: order.date,
        supplierName: order.supplierName,
        productsLabel: first
          ? order.lines.length > 1
            ? `${first.name} +${order.lines.length - 1}`
            : first.name
          : '—',
        units: round2(order.lines.reduce((total, line) => total + line.quantity, 0)),
        total: order.total,
        status: order.status,
        statusLabel: PURCHASE_ORDER_STATUS_LABELS[order.status],
      };
    });
}

/** Resumen y filas del reporte de compras. */
export function buildPurchaseReport(
  records: readonly PurchaseRecord[],
  options: PurchaseReportOptions,
  now: Date = new Date(),
): PurchaseReport {
  const rows = filterPurchaseRecords(records, {
    period: options.period,
    customFrom: options.customFrom,
    customTo: options.customTo,
    status: options.status,
    type: options.type,
    payment: options.payment,
    supplierIds: options.supplierIds,
    now,
  });
  const productTotals = new Map<string, { name: string; quantity: number; total: number }>();
  let units = 0;
  let total = 0;
  for (const record of rows) {
    total += record.total;
    for (const line of record.lines) {
      units += line.quantity;
      if (record.origin !== 'productos') continue;
      const key = normalizePurchaseText(line.name);
      const current = productTotals.get(key) ?? { name: line.name, quantity: 0, total: 0 };
      current.quantity = round2(current.quantity + line.quantity);
      current.total = round2(current.total + line.quantity * line.unitCost);
      productTotals.set(key, current);
    }
  }
  return {
    rows,
    count: rows.length,
    total: round2(total),
    units: round2(units),
    productLines: [...productTotals.values()].sort((a, b) => a.name.localeCompare(b.name, 'es')),
  };
}

function csvCell(value: string | number): string {
  const text = String(value);
  return /[";\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

/** CSV del reporte (compatible con Excel, separador `;`). */
export function purchaseReportCsv(report: PurchaseReport, includeProducts: boolean): string {
  const lines: string[] = [
    [
      'N° compra',
      'Fecha',
      'Proveedor',
      'Tipo',
      'Productos',
      'Unidades',
      'Total',
      'Pago',
      'Estado',
    ].join(';'),
  ];
  for (const record of report.rows) {
    lines.push(
      [
        record.number,
        record.date,
        record.supplierName,
        record.origin === 'directa' ? 'Directa' : 'Productos',
        record.lines.map((line) => line.name).join(' / '),
        record.lines.reduce((sum, line) => sum + line.quantity, 0),
        record.total.toFixed(2),
        PURCHASE_PAYMENT_LABELS[record.paymentMethod],
        PURCHASE_STATUS_LABELS[record.status],
      ]
        .map(csvCell)
        .join(';'),
    );
  }
  lines.push(['', '', '', '', '', '', report.total.toFixed(2), '', ''].map(csvCell).join(';'));
  if (includeProducts && report.productLines.length > 0) {
    lines.push('');
    lines.push(['Producto', 'Cantidad', 'Total'].join(';'));
    for (const row of report.productLines) {
      lines.push([row.name, row.quantity, row.total.toFixed(2)].map(csvCell).join(';'));
    }
  }
  return `\uFEFF${lines.join('\n')}`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function periodLabel(period: PurchasePeriod): string {
  return PURCHASE_PERIODS.find((item) => item.value === period)?.label ?? 'Personalizado';
}

/** Documento HTML imprimible del reporte de compras. */
export function buildPurchaseReportHtml(
  report: PurchaseReport,
  settings: PurchaseDocumentSettings,
  companyName: string,
  options: PurchaseReportOptions,
): string {
  const headerColor = /^#[0-9a-fA-F]{6}$/.test(settings.headerColor)
    ? settings.headerColor
    : DEFAULT_PURCHASE_DOCUMENT_SETTINGS.headerColor;
  const rows = report.rows
    .map(
      (record) => `<tr>
        <td>${escapeHtml(record.number)}</td>
        <td>${escapeHtml(record.date)}</td>
        <td>${escapeHtml(record.supplierName)}</td>
        <td>${escapeHtml(record.lines.map((line) => line.name).join(' / '))}</td>
        <td class="right">${record.total.toFixed(2)}</td>
      </tr>`,
    )
    .join('');
  const details = [
    settings.showRuc ? 'RUC: —' : '',
    settings.showAddress ? 'Dirección: —' : '',
    settings.showPhone ? 'Teléfono: —' : '',
  ]
    .filter(Boolean)
    .join(' · ');

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>Reporte de compras — ${escapeHtml(companyName)}</title>
<style>
  @page { margin: 18mm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #111827; margin: 0; }
  header { background: ${headerColor}; color: #fff; padding: 22px 26px; border-radius: 12px; }
  header h1 { margin: 0; font-size: 22px; }
  header p { margin: 4px 0 0; opacity: .9; font-size: 12px; }
  .meta { margin: 14px 0 8px; font-size: 11px; color: #4b5563; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 11px; }
  th { background: ${settings.matchTableColor ? headerColor : '#f3f4f6'}; color: ${settings.matchTableColor ? '#fff' : '#111827'}; text-align: left; padding: 8px; }
  td { padding: 8px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
  .right { text-align: right; white-space: nowrap; }
  .summary { margin-top: 14px; padding: 12px 14px; background: #f3f4f6; border-radius: 10px; font-size: 12px; }
  footer { margin-top: 22px; font-size: 11px; color: #6b7280; }
</style>
</head>
<body>
  <header>
    <h1>${escapeHtml(companyName)}</h1>
    <p>Reporte de compras</p>
  </header>
  <p class="meta">Periodo: ${escapeHtml(periodLabel(options.period))} · ${report.count} compras · Generado ${escapeHtml(new Date().toLocaleDateString('es-NI'))}</p>
  ${details ? `<p class="meta">${escapeHtml(details)}</p>` : ''}
  <table>
    <thead><tr><th>N° compra</th><th>Fecha</th><th>Proveedor</th><th>Productos</th><th class="right">Total</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="5">Sin compras en el periodo.</td></tr>'}</tbody>
  </table>
  <div class="summary">Compras: <strong>${report.count}</strong> · Unidades: <strong>${report.units}</strong> · Total: <strong>NIO ${report.total.toFixed(2)}</strong></div>
  ${settings.footerMessage ? `<footer>${escapeHtml(settings.footerMessage)}</footer>` : ''}
</body>
</html>`;
}

/** Cantidad de páginas del historial. */
export function purchasePageCount(
  filteredCount: number,
  pageSize = PURCHASE_HISTORY_PAGE_SIZE,
): number {
  return Math.max(1, Math.ceil(filteredCount / pageSize));
}
