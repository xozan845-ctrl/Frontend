import {
  unwrapApiListResponse,
  unwrapApiSingleResponse,
} from '../../../../../core/models/api-response.dto';
import { adaptCatalogProductFromBackend } from '../../../products/public-api';
import type {
  BackendComboComponentDTO,
  BackendComboDTO,
  BackendImportResultDTO,
  BackendInventoryMovementDTO,
  BackendInventorySettingsDTO,
  BackendMovementLineDTO,
  BackendPromotionDTO,
  BackendScanResultDTO,
} from '../../models/company-catalog-operations.dto';
import type {
  CompanyCombo,
  CompanyComboComponent,
  CompanyComboFormValue,
  CompanyInventoryCostMethod,
  CompanyInventoryMovement,
  CompanyInventoryMovementFormValue,
  CompanyInventoryMovementType,
  CompanyInventorySettings,
  CompanyInventorySettingsFormValue,
  CompanyProductImportResult,
  CompanyProductImportRow,
  CompanyPromotion,
  CompanyPromotionFormValue,
  CompanyPromotionType,
  CompanyScanResult,
} from '../../models/company-catalog-operations.model';
import type { CompanyCatalogStatus } from '../../models/company-catalog.model';
import { adaptCompanyServiceFromBackend } from '../company-service/company-service.adapter';

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function toText(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function toNumber(value: unknown, fallback = 0): number {
  const n = typeof value === 'string' ? Number(value.replace(',', '.')) : value;
  if (typeof n !== 'number' || !Number.isFinite(n)) return fallback;
  return n;
}

function toMoney(value: unknown, fallback = 0): number {
  return Math.round(Math.max(0, toNumber(value, fallback)) * 100) / 100;
}

function toInt(value: unknown, fallback = 0): number {
  return Math.max(0, Math.trunc(toNumber(value, fallback)));
}

function toNullableInt(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = toNumber(value, Number.NaN);
  return Number.isFinite(n) && n >= 0 ? Math.trunc(n) : null;
}

function toBoolean(value: unknown): boolean {
  return value === true;
}

function toIso(value: unknown, fallback: string): string {
  if (typeof value !== 'string' || !value.trim()) return fallback;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? fallback : new Date(parsed).toISOString();
}

function toDateText(value: unknown, fallback = ''): string {
  if (typeof value !== 'string' || !value.trim()) return fallback;
  return value.slice(0, 10);
}

function toStatus(value: unknown): CompanyCatalogStatus {
  return value === 'inactivo' ? 'inactivo' : 'activo';
}

function toCostMethod(value: unknown): CompanyInventoryCostMethod {
  return value === 'fifo' || value === 'ueps' ? value : 'promedio';
}

function toPromotionType(value: unknown): CompanyPromotionType {
  switch (value) {
    case 'descuento_cantidad':
    case 'descuento_porcentaje':
    case 'regalo':
      return value;
    default:
      return '2x1';
  }
}

function toMovementType(value: unknown): CompanyInventoryMovementType {
  switch (value) {
    case 'salida':
    case 'ajuste':
    case 'traslado':
      return value;
    default:
      return 'entrada';
  }
}

/** Extrae los elementos de una página tolerando arrays/envelopes. */
function extractPageItems(response: unknown): unknown[] {
  const direct = unwrapApiListResponse<unknown>(response);
  if (direct.length > 0) return direct;
  if (!isRecord(response)) return [];
  const wrapped = unwrapApiSingleResponse<Record<string, unknown>>(response);
  if (!wrapped || typeof wrapped !== 'object') return [];
  const list = wrapped['items'] ?? wrapped['data'] ?? wrapped['results'];
  return Array.isArray(list) ? list : [];
}

/** Normaliza `ConfiguracionInventarioResponseDto`. */
export function adaptInventorySettingsFromBackend(raw: unknown): CompanyInventorySettings | null {
  const settings = unwrapApiSingleResponse<BackendInventorySettingsDTO>(raw);
  if (!settings || typeof settings !== 'object') return null;
  return {
    companyId: toText(settings.empresa_id ?? settings.empresaId),
    costMethod: toCostMethod(settings.metodo_costeo ?? settings.metodoCosteo),
    allowNegativeStock: toBoolean(
      settings.permitir_stock_negativo ?? settings.permitirStockNegativo,
    ),
    lowStockAlert: toBoolean(settings.alerta_stock_bajo ?? settings.alertaStockBajo),
    updateCostOnPurchase: toBoolean(
      settings.actualizar_costo_en_compra ?? settings.actualizarCostoEnCompra,
    ),
    defaultUnit: toText(settings.unidad_defecto ?? settings.unidadDefecto, 'Unidad (u)'),
    updatedAt: toIso(settings.actualizado_en ?? settings.actualizadoEn, ''),
  };
}

function adaptComboComponent(raw: unknown): CompanyComboComponent | null {
  if (!isRecord(raw)) return null;
  const component = raw as BackendComboComponentDTO;
  const sku = toText(component.sku);
  if (!sku) return null;
  return {
    productId: toText(component.producto_id ?? component.productoId),
    sku,
    name: toText(component.nombre, sku),
    quantity: Math.max(1, toInt(component.cantidad, 1)),
    unitCost: toMoney(component.costo_unitario ?? component.costoUnitario),
    subtotal: toMoney(component.subtotal),
  };
}

/** Normaliza `ComboResponseDto`. */
export function adaptComboFromBackend(raw: unknown): CompanyCombo | null {
  const combo = unwrapApiSingleResponse<BackendComboDTO>(raw);
  if (!combo || typeof combo !== 'object' || !combo.id) return null;
  const createdAt = toIso(combo.creado_en ?? combo.creadoEn, '');
  return {
    id: String(combo.id),
    companyId: toText(combo.empresa_id ?? combo.empresaId),
    sku: toText(combo.sku),
    name: toText(combo.nombre, 'Combo'),
    description: toText(combo.descripcion),
    barcode: toText(combo.codigo_barras ?? combo.codigoBarras),
    price: toMoney(combo.precio),
    totalCost: toMoney(combo.costo_total ?? combo.costoTotal),
    margin: toNumber(combo.margen),
    status: toStatus(combo.estado),
    components: (combo.componentes ?? [])
      .map((component) => adaptComboComponent(component))
      .filter((component): component is CompanyComboComponent => component !== null),
    createdAt,
    updatedAt: toIso(combo.actualizado_en ?? combo.actualizadoEn, createdAt),
  };
}

/** Normaliza el listado de combos. */
export function adaptCombosFromBackend(response: unknown): CompanyCombo[] {
  const combos: CompanyCombo[] = [];
  for (const item of extractPageItems(response)) {
    const combo = adaptComboFromBackend(item);
    if (!combo || combos.some((current) => current.id === combo.id)) continue;
    combos.push(combo);
  }
  return combos;
}

/** Normaliza `PromocionResponseDto`. */
export function adaptPromotionFromBackend(raw: unknown): CompanyPromotion | null {
  const promotion = unwrapApiSingleResponse<BackendPromotionDTO>(raw);
  if (!promotion || typeof promotion !== 'object' || !promotion.id) return null;
  const createdAt = toIso(promotion.creado_en ?? promotion.creadoEn, '');
  return {
    id: String(promotion.id),
    companyId: toText(promotion.empresa_id ?? promotion.empresaId),
    name: toText(promotion.nombre, 'Promoción'),
    type: toPromotionType(promotion.tipo),
    productId: toText(promotion.producto_id ?? promotion.productoId) || null,
    sku: toText(promotion.sku),
    requiredQuantity: toNullableInt(promotion.cantidad_requerida ?? promotion.cantidadRequerida),
    freeQuantity: toNullableInt(promotion.cantidad_gratis ?? promotion.cantidadGratis),
    discountPercentage: toNullableInt(
      promotion.descuento_porcentaje ?? promotion.descuentoPorcentaje,
    ),
    from: toDateText(promotion.fecha_desde ?? promotion.fechaDesde),
    to: toDateText(promotion.fecha_hasta ?? promotion.fechaHasta),
    status: toStatus(promotion.estado),
    createdAt,
    updatedAt: toIso(promotion.actualizado_en ?? promotion.actualizadoEn, createdAt),
  };
}

/** Normaliza el listado de promociones. */
export function adaptPromotionsFromBackend(response: unknown): CompanyPromotion[] {
  const promotions: CompanyPromotion[] = [];
  for (const item of extractPageItems(response)) {
    const promotion = adaptPromotionFromBackend(item);
    if (!promotion || promotions.some((current) => current.id === promotion.id)) continue;
    promotions.push(promotion);
  }
  return promotions;
}

function adaptMovementLine(raw: unknown): CompanyInventoryMovement['lines'][number] | null {
  if (!isRecord(raw)) return null;
  const line = raw as BackendMovementLineDTO;
  const sku = toText(line.sku);
  if (!sku) return null;
  return {
    productId: toText(line.producto_id ?? line.productoId),
    sku,
    name: toText(line.nombre, sku),
    quantity: toInt(line.cantidad),
  };
}

/** Normaliza `MovimientoInventarioResponseDto`. */
export function adaptMovementFromBackend(raw: unknown): CompanyInventoryMovement | null {
  const movement = unwrapApiSingleResponse<BackendInventoryMovementDTO>(raw);
  if (!movement || typeof movement !== 'object' || !movement.id) return null;
  return {
    id: String(movement.id),
    companyId: toText(movement.empresa_id ?? movement.empresaId),
    type: toMovementType(movement.tipo),
    reason: toText(movement.motivo),
    reference: toText(movement.referencia),
    origin: toText(movement.ubicacion_origen ?? movement.ubicacionOrigen),
    destination: toText(movement.ubicacion_destino ?? movement.ubicacionDestino),
    lines: (movement.lineas ?? [])
      .map((line) => adaptMovementLine(line))
      .filter((line): line is CompanyInventoryMovement['lines'][number] => line !== null),
    createdBy: toText(movement.creado_por ?? movement.creadoPor),
    createdAt: toIso(movement.creado_en ?? movement.creadoEn, ''),
  };
}

/** Normaliza el listado de movimientos. */
export function adaptMovementsFromBackend(response: unknown): CompanyInventoryMovement[] {
  const movements: CompanyInventoryMovement[] = [];
  for (const item of extractPageItems(response)) {
    const movement = adaptMovementFromBackend(item);
    if (!movement || movements.some((current) => current.id === movement.id)) continue;
    movements.push(movement);
  }
  return movements;
}

/** Normaliza `ImportarProductosResponseDto`. */
export function adaptImportResultFromBackend(raw: unknown): CompanyProductImportResult {
  const result = unwrapApiSingleResponse<BackendImportResultDTO>(raw);
  if (!result || typeof result !== 'object') {
    return { imported: 0, skipped: 0, errors: [] };
  }
  return {
    imported: toInt(result.importados),
    skipped: toInt(result.omitidos),
    errors: Array.isArray(result.errores) ? result.errores.filter(Boolean) : [],
  };
}

/** Normaliza `EscaneoResponseDto`. */
export function adaptScanResultFromBackend(raw: unknown): CompanyScanResult | null {
  const result = unwrapApiSingleResponse<BackendScanResultDTO>(raw);
  if (!result || typeof result !== 'object') return null;

  const product = result.producto ? adaptCatalogProductFromBackend(result.producto) : null;
  const service = result.servicio ? adaptCompanyServiceFromBackend(result.servicio) : null;
  const declared =
    result.tipo === 'servicio' ? 'servicio' : result.tipo === 'producto' ? 'producto' : null;
  const kind = declared ?? (product ? 'producto' : 'servicio');
  if (kind === 'servicio' && !service) return null;
  if (kind === 'producto' && !product) return null;
  return { kind, product, service };
}

/** Payload de configuración de inventario. */
export function inventorySettingsToPayload(
  form: CompanyInventorySettingsFormValue,
): Record<string, unknown> {
  return {
    metodo_costeo: form.costMethod,
    permitir_stock_negativo: form.allowNegativeStock,
    alerta_stock_bajo: form.lowStockAlert,
    actualizar_costo_en_compra: form.updateCostOnPurchase,
    unidad_defecto: form.defaultUnit.trim(),
  };
}

function comboComponentsPayload(form: CompanyComboFormValue): Record<string, unknown>[] {
  return form.components
    .filter((component) => component.sku.trim())
    .map((component) => {
      const payload: Record<string, unknown> = {
        sku: component.sku.trim(),
        cantidad: Math.max(1, Math.trunc(component.quantity)),
      };
      if (component.productId.trim()) payload['producto_id'] = component.productId.trim();
      return payload;
    });
}

/** Payload de alta de combo. */
export function comboToCreatePayload(form: CompanyComboFormValue): Record<string, unknown> {
  return {
    sku: form.sku.trim(),
    nombre: form.name.trim(),
    descripcion: form.description.trim(),
    codigo_barras: form.barcode.trim(),
    precio: form.price.trim(),
    estado: form.status,
    componentes: comboComponentsPayload(form),
  };
}

/** Payload de edición de combo (el SKU no se modifica). */
export function comboToUpdatePayload(form: CompanyComboFormValue): Record<string, unknown> {
  const payload = comboToCreatePayload(form);
  delete payload['sku'];
  return payload;
}

/** Payload de alta/edición de promoción. */
export function promotionToPayload(form: CompanyPromotionFormValue): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    nombre: form.name.trim(),
    tipo: form.type,
    fecha_desde: form.from,
    fecha_hasta: form.to,
    estado: form.status,
  };
  if (form.productId.trim()) payload['producto_id'] = form.productId.trim();
  if (form.sku.trim()) payload['sku'] = form.sku.trim();
  if (form.requiredQuantity !== null) payload['cantidad_requerida'] = form.requiredQuantity;
  if (form.freeQuantity !== null) payload['cantidad_gratis'] = form.freeQuantity;
  if (form.discountPercentage !== null) {
    payload['descuento_porcentaje'] = form.discountPercentage;
  }
  return payload;
}

/** Payload de alta de movimiento de inventario. */
export function movementToPayload(
  form: CompanyInventoryMovementFormValue,
): Record<string, unknown> {
  return {
    tipo: form.type,
    motivo: form.reason.trim(),
    referencia: form.reference.trim(),
    ubicacion_origen: form.origin.trim(),
    ubicacion_destino: form.destination.trim(),
    lineas: form.lines
      .filter((line) => line.sku.trim())
      .map((line) => {
        const payload: Record<string, unknown> = {
          sku: line.sku.trim(),
          cantidad: Math.max(0, Math.trunc(line.quantity)),
        };
        if (line.productId.trim()) payload['producto_id'] = line.productId.trim();
        return payload;
      }),
  };
}

/** Payload de una fila de importación. */
export function importRowToPayload(row: CompanyProductImportRow): Record<string, unknown> {
  return {
    sku: row.sku,
    nombre: row.name,
    descripcion: row.description,
    categoria: row.category,
    precio_base: row.basePrice,
    stock: row.stock,
    costo: row.cost || undefined,
    marca: row.brand,
    codigo_barras: row.barcode,
    unidad: row.unit,
    stock_minimo: row.minStock,
    stock_maximo: row.maxStock,
    es_materia_prima: row.isRawMaterial,
    ubicacion: row.location,
  };
}
