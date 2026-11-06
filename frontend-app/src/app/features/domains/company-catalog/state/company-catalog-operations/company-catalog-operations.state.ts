import type {
  CompanyCombo,
  CompanyInventoryMovement,
  CompanyInventorySettings,
  CompanyProductImportResult,
  CompanyPromotion,
  CompanyScanResult,
} from '../../models/company-catalog-operations.model';

export interface CompanyCatalogOperationsState {
  settings: CompanyInventorySettings | null;
  settingsLoading: boolean;
  settingsSaving: boolean;
  settingsError: string | null;
  settingsSaved: boolean;

  combos: CompanyCombo[];
  combosLoading: boolean;
  combosSaving: boolean;
  combosError: string | null;
  lastComboSaved: CompanyCombo | null;
  lastComboRemovedId: string | null;

  promotions: CompanyPromotion[];
  promotionsLoading: boolean;
  promotionsSaving: boolean;
  promotionsError: string | null;
  lastPromotionSaved: CompanyPromotion | null;
  lastPromotionRemovedId: string | null;

  movements: CompanyInventoryMovement[];
  movementsLoading: boolean;
  movementsSaving: boolean;
  movementsError: string | null;
  lastMovementSaved: CompanyInventoryMovement | null;

  importing: boolean;
  importResult: CompanyProductImportResult | null;
  importError: string | null;

  scanning: boolean;
  scanResult: CompanyScanResult | null;
  scanError: string | null;
}
