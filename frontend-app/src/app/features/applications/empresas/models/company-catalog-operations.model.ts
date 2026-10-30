import type { CatalogProduct } from '../../products/public-api';
import type { CompanyCatalogStatus } from './company-catalog.model';
import type { CompanyService } from './company-service.model';

/** Método de costeo configurable por empresa. */
export type CompanyInventoryCostMethod = 'promedio' | 'fifo' | 'ueps';

/** Configuración de inventario (`/catalog/configuracion-inventario`). */
export interface CompanyInventorySettings {
  companyId: string;
  costMethod: CompanyInventoryCostMethod;
  allowNegativeStock: boolean;
  lowStockAlert: boolean;
  updateCostOnPurchase: boolean;
  defaultUnit: string;
  updatedAt: string;
}

/** Valores editables de la configuración de inventario. */
export interface CompanyInventorySettingsFormValue {
  costMethod: CompanyInventoryCostMethod;
  allowNegativeStock: boolean;
  lowStockAlert: boolean;
  updateCostOnPurchase: boolean;
  defaultUnit: string;
}

/** Componente vendible de un combo. */
export interface CompanyComboComponent {
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  unitCost: number;
  subtotal: number;
}

/** Combo de productos (`/catalog/combos`). */
export interface CompanyCombo {
  id: string;
  companyId: string;
  sku: string;
  name: string;
  description: string;
  barcode: string;
  price: number;
  totalCost: number;
  margin: number;
  status: CompanyCatalogStatus;
  components: CompanyComboComponent[];
  createdAt: string;
  updatedAt: string;
}

/** Componente que emite el modal de combos. */
export interface CompanyComboComponentFormValue {
  productId: string;
  sku: string;
  name: string;
  quantity: number;
}

/** Datos editables del combo. */
export interface CompanyComboFormValue {
  sku: string;
  name: string;
  description: string;
  barcode: string;
  /** Precio decimal como string (ej. "2500.00"). */
  price: string;
  status: CompanyCatalogStatus;
  components: CompanyComboComponentFormValue[];
}

/** Tipos de promoción soportados por el backend. */
export type CompanyPromotionType = '2x1' | 'descuento_cantidad' | 'descuento_porcentaje' | 'regalo';

/** Promoción (`/catalog/promociones`). */
export interface CompanyPromotion {
  id: string;
  companyId: string;
  name: string;
  type: CompanyPromotionType;
  productId: string | null;
  sku: string;
  requiredQuantity: number | null;
  freeQuantity: number | null;
  discountPercentage: number | null;
  from: string;
  to: string;
  status: CompanyCatalogStatus;
  createdAt: string;
  updatedAt: string;
}

/** Fila derivada de promoción para la tabla. */
export interface CompanyPromotionView extends CompanyPromotion {
  typeLabel: string;
  detail: string;
}

/** Datos editables de la promoción. */
export interface CompanyPromotionFormValue {
  name: string;
  type: CompanyPromotionType;
  productId: string;
  sku: string;
  requiredQuantity: number | null;
  freeQuantity: number | null;
  discountPercentage: number | null;
  /** Fecha local yyyy-mm-dd. */
  from: string;
  /** Fecha local yyyy-mm-dd. */
  to: string;
  status: CompanyCatalogStatus;
}

/** Tipos de movimiento de inventario. */
export type CompanyInventoryMovementType = 'entrada' | 'salida' | 'ajuste' | 'traslado';

/** Línea de un movimiento de inventario. */
export interface CompanyInventoryMovementLine {
  productId: string;
  sku: string;
  name: string;
  quantity: number;
}

/** Movimiento de inventario (`/catalog/inventario/movimientos`). */
export interface CompanyInventoryMovement {
  id: string;
  companyId: string;
  type: CompanyInventoryMovementType;
  reason: string;
  reference: string;
  origin: string;
  destination: string;
  lines: CompanyInventoryMovementLine[];
  createdBy: string;
  createdAt: string;
}

/** Fila derivada de movimiento para la tabla. */
export interface CompanyInventoryMovementView extends CompanyInventoryMovement {
  typeLabel: string;
}

/** Datos editables de un movimiento. */
export interface CompanyInventoryMovementFormValue {
  type: CompanyInventoryMovementType;
  reason: string;
  reference: string;
  origin: string;
  destination: string;
  lines: CompanyInventoryMovementLine[];
}

/** Fila validada de importación de productos. */
export interface CompanyProductImportRow {
  sku: string;
  name: string;
  description: string;
  category: string;
  /** Precio decimal como string. */
  basePrice: string;
  stock: number;
  cost: string;
  brand: string;
  barcode: string;
  unit: string;
  minStock: number;
  maxStock: number | null;
  isRawMaterial: boolean;
  location: string;
}

/** Resultado de `POST /catalog/productos/importar`. */
export interface CompanyProductImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

/** Resultado de `GET /catalog/escanear`. */
export interface CompanyScanResult {
  kind: 'producto' | 'servicio';
  product: CatalogProduct | null;
  service: CompanyService | null;
}
