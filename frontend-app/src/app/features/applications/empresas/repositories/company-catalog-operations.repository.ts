import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import type {
  CompanyCombo,
  CompanyComboFormValue,
  CompanyInventoryMovement,
  CompanyInventoryMovementFormValue,
  CompanyInventorySettings,
  CompanyInventorySettingsFormValue,
  CompanyProductImportResult,
  CompanyProductImportRow,
  CompanyPromotion,
  CompanyPromotionFormValue,
  CompanyScanResult,
} from '../models/company-catalog-operations.model';

/**
 * Puerto HTTP de las operaciones del catálogo (R-PS-04): configuración de
 * inventario, importación, escaneo, combos, promociones y movimientos.
 */
export interface CompanyCatalogOperationsRepository {
  getInventorySettings(): Observable<CompanyInventorySettings>;
  saveInventorySettings(
    form: CompanyInventorySettingsFormValue,
  ): Observable<CompanyInventorySettings>;

  listCombos(): Observable<CompanyCombo[]>;
  createCombo(form: CompanyComboFormValue): Observable<CompanyCombo>;
  updateCombo(id: string, form: CompanyComboFormValue): Observable<CompanyCombo>;
  removeCombo(id: string): Observable<void>;

  listPromotions(): Observable<CompanyPromotion[]>;
  createPromotion(form: CompanyPromotionFormValue): Observable<CompanyPromotion>;
  updatePromotion(id: string, form: CompanyPromotionFormValue): Observable<CompanyPromotion>;
  removePromotion(id: string): Observable<void>;

  listMovements(): Observable<CompanyInventoryMovement[]>;
  createMovement(form: CompanyInventoryMovementFormValue): Observable<CompanyInventoryMovement>;

  importProducts(rows: readonly CompanyProductImportRow[]): Observable<CompanyProductImportResult>;
  scan(code: string): Observable<CompanyScanResult>;
}

export const COMPANY_CATALOG_OPERATIONS_REPOSITORY =
  new InjectionToken<CompanyCatalogOperationsRepository>('CompanyCatalogOperationsRepository');
