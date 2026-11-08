import { DEFAULT_PURCHASE_DOCUMENT_SETTINGS } from '../../constants/purchases.constants';
import type {
  PurchaseCostType,
  PurchaseDocumentSettings,
  PurchaseLine,
  PurchaseOrder,
  PurchaseOrderStatus,
  PurchaseOrigin,
  PurchasePaymentMethod,
  PurchaseRecord,
  PurchaseStatus,
  Supplier,
} from '../../models/purchase.model';
import {
  createPurchaseId,
  includes,
  isRecord,
  isValidMoney,
  round2,
  sumLines,
  toDate,
  toIso,
  toNumber,
  toText,
} from './purchases.adapter';

const PURCHASE_STATUS_VALUES: readonly PurchaseStatus[] = ['recibida', 'pendiente', 'anulada'];
const ORDER_STATUS_VALUES: readonly PurchaseOrderStatus[] = ['pendiente', 'convertida', 'anulada'];
const PAYMENT_VALUES: readonly PurchasePaymentMethod[] = [
  'efectivo',
  'tarjeta',
  'transferencia',
  'credito',
];
const COST_TYPE_VALUES: readonly PurchaseCostType[] = ['inventario', 'servicio', 'gasto', 'otro'];
const ORIGIN_VALUES: readonly PurchaseOrigin[] = ['productos', 'directa'];

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
