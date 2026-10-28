import type { CompanyCatalogFieldType, CompanyCatalogStatus } from './company-catalog.model';

/**
 * Campos del producto que Core Engine todavía no expone en
 * `/catalog/productos`. Se guardan localmente por tenant (ADR-55).
 */
export interface CompanyProductMetadata {
  cost: number;
  brand: string;
  barcode: string;
  unit: string;
  allowFractions: boolean;
  purchaseUnit: string;
  contentAmount: number;
  contentUnit: string;
  priceType: CompanyCatalogFieldType;
  costType: CompanyCatalogFieldType;
  minStock: number;
  maxStock: number | null;
  warrantyMonths: number | null;
  isRawMaterial: boolean;
  location: string;
  /** Permite reflejar el estado elegido en el catálogo local. */
  statusOverride: CompanyCatalogStatus | null;
  createdAt: string;
  updatedAt: string;
}
