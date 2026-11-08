import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, pipe } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { NotificationService } from '@core/services/notification/notification.service';
import {
  movementTypeLabel,
  promotionDetailLabel,
  promotionTypeLabel,
} from '../../models/company-catalog-operations.labels';
import type {
  CompanyComboFormValue,
  CompanyInventoryMovementFormValue,
  CompanyInventorySettingsFormValue,
  CompanyProductImportRow,
  CompanyPromotionFormValue,
} from '../../models/company-catalog-operations.model';
import { COMPANY_CATALOG_OPERATIONS_REPOSITORY } from '../../repositories/company-catalog-operations.repository';
import type { CompanyCatalogOperationsState } from './company-catalog-operations.state';
import {
  validateCombo,
  validateMovement,
  validatePromotion,
} from '../../models/company-catalog-operations.validation';

const initialState: CompanyCatalogOperationsState = {
  settings: null,
  settingsLoading: false,
  settingsSaving: false,
  settingsError: null,
  settingsSaved: false,
  combos: [],
  combosLoading: false,
  combosSaving: false,
  combosError: null,
  lastComboSaved: null,
  lastComboRemovedId: null,
  promotions: [],
  promotionsLoading: false,
  promotionsSaving: false,
  promotionsError: null,
  lastPromotionSaved: null,
  lastPromotionRemovedId: null,
  movements: [],
  movementsLoading: false,
  movementsSaving: false,
  movementsError: null,
  lastMovementSaved: null,
  importing: false,
  importResult: null,
  importError: null,
  scanning: false,
  scanResult: null,
  scanError: null,
};

/**
 * Operaciones del catálogo (R-PS-04): configuración, combos, promociones,
 * movimientos, importación y escaneo. Cada mutación se confirma con la
 * respuesta del API; los listados paginados se consumen completos.
 */
export const CompanyCatalogOperationsStore = signalStore(
  withState(initialState),
  withComputed(({ combos, promotions, movements }) => ({
    comboCount: computed(() => combos().length),
    activeComboCount: computed(() => combos().filter((combo) => combo.status === 'activo').length),
    promotionCount: computed(() => promotions().length),
    activePromotionCount: computed(
      () => promotions().filter((promotion) => promotion.status === 'activo').length,
    ),
    movementCount: computed(() => movements().length),
    promotionRows: computed(() =>
      promotions().map((promotion) => ({
        ...promotion,
        typeLabel: promotionTypeLabel(promotion.type),
        detail: promotionDetailLabel(promotion),
      })),
    ),
    movementRows: computed(() =>
      movements().map((movement) => ({
        ...movement,
        typeLabel: movementTypeLabel(movement.type),
      })),
    ),
  })),
  withMethods(
    (
      store,
      repo = inject(COMPANY_CATALOG_OPERATIONS_REPOSITORY),
      notificationService = inject(NotificationService),
    ) => {
      const fail = (
        section: 'settings' | 'combos' | 'promotions' | 'movements' | 'import' | 'scan',
        message: string,
      ) => {
        switch (section) {
          case 'settings':
            patchState(store, {
              settingsLoading: false,
              settingsSaving: false,
              settingsError: message,
            });
            break;
          case 'combos':
            patchState(store, { combosLoading: false, combosSaving: false, combosError: message });
            break;
          case 'promotions':
            patchState(store, {
              promotionsLoading: false,
              promotionsSaving: false,
              promotionsError: message,
            });
            break;
          case 'movements':
            patchState(store, {
              movementsLoading: false,
              movementsSaving: false,
              movementsError: message,
            });
            break;
          case 'import':
            patchState(store, { importing: false, importError: message });
            break;
          case 'scan':
            patchState(store, { scanning: false, scanError: message });
            break;
        }
        notificationService.showError(message);
      };

      return {
        loadSettings: rxMethod<void>(
          pipe(
            tap(() => patchState(store, { settingsLoading: true, settingsError: null })),
            switchMap(() =>
              repo.getInventorySettings().pipe(
                tap((settings) =>
                  patchState(store, {
                    settings,
                    settingsLoading: false,
                    settingsError: null,
                  }),
                ),
                catchError((error: Error) => {
                  fail('settings', error.message || 'No se pudo cargar la configuración.');
                  return EMPTY;
                }),
              ),
            ),
          ),
        ),

        saveSettings: rxMethod<CompanyInventorySettingsFormValue>(
          pipe(
            tap(() => patchState(store, { settingsSaving: true, settingsError: null })),
            switchMap((form) => {
              if (!form.defaultUnit.trim()) {
                fail('settings', 'Indica la unidad por defecto.');
                return EMPTY;
              }
              return repo.saveInventorySettings(form).pipe(
                tap((settings) => {
                  patchState(store, {
                    settings,
                    settingsSaving: false,
                    settingsError: null,
                    settingsSaved: true,
                  });
                  notificationService.showSuccess('Configuración de inventario guardada.');
                }),
                catchError((error: Error) => {
                  fail('settings', error.message || 'No se pudo guardar la configuración.');
                  return EMPTY;
                }),
              );
            }),
          ),
        ),

        loadCombos: rxMethod<void>(
          pipe(
            tap(() => patchState(store, { combosLoading: true, combosError: null })),
            switchMap(() =>
              repo.listCombos().pipe(
                tap((combos) =>
                  patchState(store, { combos, combosLoading: false, combosError: null }),
                ),
                catchError((error: Error) => {
                  fail('combos', error.message || 'No se pudieron cargar los combos.');
                  return EMPTY;
                }),
              ),
            ),
          ),
        ),

        createCombo: rxMethod<CompanyComboFormValue>(
          pipe(
            tap(() => patchState(store, { combosSaving: true, combosError: null })),
            switchMap((form) => {
              const validationError = validateCombo(form);
              if (validationError) {
                fail('combos', validationError);
                return EMPTY;
              }
              return repo.createCombo(form).pipe(
                tap((combo) => {
                  patchState(store, {
                    combos: [combo, ...store.combos()],
                    combosSaving: false,
                    combosError: null,
                    lastComboSaved: combo,
                  });
                  notificationService.showSuccess(`Combo "${combo.name}" creado.`);
                }),
                catchError((error: Error) => {
                  fail('combos', error.message || 'No se pudo crear el combo.');
                  return EMPTY;
                }),
              );
            }),
          ),
        ),

        updateCombo: rxMethod<{ id: string; form: CompanyComboFormValue }>(
          pipe(
            tap(() => patchState(store, { combosSaving: true, combosError: null })),
            switchMap(({ id, form }) => {
              const validationError = validateCombo(form);
              if (validationError) {
                fail('combos', validationError);
                return EMPTY;
              }
              return repo.updateCombo(id, form).pipe(
                tap((combo) => {
                  patchState(store, {
                    combos: store.combos().map((current) => (current.id === id ? combo : current)),
                    combosSaving: false,
                    combosError: null,
                    lastComboSaved: combo,
                  });
                  notificationService.showSuccess(`Combo "${combo.name}" actualizado.`);
                }),
                catchError((error: Error) => {
                  fail('combos', error.message || 'No se pudo actualizar el combo.');
                  return EMPTY;
                }),
              );
            }),
          ),
        ),

        removeCombo: rxMethod<string>(
          pipe(
            tap(() => patchState(store, { combosSaving: true, combosError: null })),
            switchMap((id) => {
              const combo = store.combos().find((current) => current.id === id);
              if (!combo) {
                fail('combos', 'El combo ya no existe.');
                return EMPTY;
              }
              return repo.removeCombo(id).pipe(
                tap(() => {
                  patchState(store, {
                    combos: store.combos().filter((current) => current.id !== id),
                    combosSaving: false,
                    combosError: null,
                    lastComboRemovedId: id,
                  });
                  notificationService.showSuccess(`Combo "${combo.name}" eliminado.`);
                }),
                catchError((error: Error) => {
                  fail('combos', error.message || 'No se pudo eliminar el combo.');
                  return EMPTY;
                }),
              );
            }),
          ),
        ),

        loadPromotions: rxMethod<void>(
          pipe(
            tap(() => patchState(store, { promotionsLoading: true, promotionsError: null })),
            switchMap(() =>
              repo.listPromotions().pipe(
                tap((promotions) =>
                  patchState(store, {
                    promotions,
                    promotionsLoading: false,
                    promotionsError: null,
                  }),
                ),
                catchError((error: Error) => {
                  fail('promotions', error.message || 'No se pudieron cargar las promociones.');
                  return EMPTY;
                }),
              ),
            ),
          ),
        ),

        createPromotion: rxMethod<CompanyPromotionFormValue>(
          pipe(
            tap(() => patchState(store, { promotionsSaving: true, promotionsError: null })),
            switchMap((form) => {
              const validationError = validatePromotion(form);
              if (validationError) {
                fail('promotions', validationError);
                return EMPTY;
              }
              return repo.createPromotion(form).pipe(
                tap((promotion) => {
                  patchState(store, {
                    promotions: [promotion, ...store.promotions()],
                    promotionsSaving: false,
                    promotionsError: null,
                    lastPromotionSaved: promotion,
                  });
                  notificationService.showSuccess(`Promoción "${promotion.name}" creada.`);
                }),
                catchError((error: Error) => {
                  fail('promotions', error.message || 'No se pudo crear la promoción.');
                  return EMPTY;
                }),
              );
            }),
          ),
        ),

        updatePromotion: rxMethod<{ id: string; form: CompanyPromotionFormValue }>(
          pipe(
            tap(() => patchState(store, { promotionsSaving: true, promotionsError: null })),
            switchMap(({ id, form }) => {
              const validationError = validatePromotion(form);
              if (validationError) {
                fail('promotions', validationError);
                return EMPTY;
              }
              return repo.updatePromotion(id, form).pipe(
                tap((promotion) => {
                  patchState(store, {
                    promotions: store
                      .promotions()
                      .map((current) => (current.id === id ? promotion : current)),
                    promotionsSaving: false,
                    promotionsError: null,
                    lastPromotionSaved: promotion,
                  });
                  notificationService.showSuccess(`Promoción "${promotion.name}" actualizada.`);
                }),
                catchError((error: Error) => {
                  fail('promotions', error.message || 'No se pudo actualizar la promoción.');
                  return EMPTY;
                }),
              );
            }),
          ),
        ),

        removePromotion: rxMethod<string>(
          pipe(
            tap(() => patchState(store, { promotionsSaving: true, promotionsError: null })),
            switchMap((id) => {
              const promotion = store.promotions().find((current) => current.id === id);
              if (!promotion) {
                fail('promotions', 'La promoción ya no existe.');
                return EMPTY;
              }
              return repo.removePromotion(id).pipe(
                tap(() => {
                  patchState(store, {
                    promotions: store.promotions().filter((current) => current.id !== id),
                    promotionsSaving: false,
                    promotionsError: null,
                    lastPromotionRemovedId: id,
                  });
                  notificationService.showSuccess(`Promoción "${promotion.name}" eliminada.`);
                }),
                catchError((error: Error) => {
                  fail('promotions', error.message || 'No se pudo eliminar la promoción.');
                  return EMPTY;
                }),
              );
            }),
          ),
        ),

        loadMovements: rxMethod<void>(
          pipe(
            tap(() => patchState(store, { movementsLoading: true, movementsError: null })),
            switchMap(() =>
              repo.listMovements().pipe(
                tap((movements) =>
                  patchState(store, {
                    movements,
                    movementsLoading: false,
                    movementsError: null,
                  }),
                ),
                catchError((error: Error) => {
                  fail('movements', error.message || 'No se pudieron cargar los movimientos.');
                  return EMPTY;
                }),
              ),
            ),
          ),
        ),

        createMovement: rxMethod<CompanyInventoryMovementFormValue>(
          pipe(
            tap(() => patchState(store, { movementsSaving: true, movementsError: null })),
            switchMap((form) => {
              const validationError = validateMovement(form);
              if (validationError) {
                fail('movements', validationError);
                return EMPTY;
              }
              return repo.createMovement(form).pipe(
                tap((movement) => {
                  patchState(store, {
                    movements: [movement, ...store.movements()],
                    movementsSaving: false,
                    movementsError: null,
                    lastMovementSaved: movement,
                  });
                  notificationService.showSuccess('Movimiento de inventario registrado.');
                }),
                catchError((error: Error) => {
                  fail('movements', error.message || 'No se pudo registrar el movimiento.');
                  return EMPTY;
                }),
              );
            }),
          ),
        ),

        importProducts: rxMethod<readonly CompanyProductImportRow[]>(
          pipe(
            tap(() =>
              patchState(store, { importing: true, importError: null, importResult: null }),
            ),
            switchMap((rows) => {
              if (rows.length === 0) {
                fail('import', 'No hay filas válidas para importar.');
                return EMPTY;
              }
              if (rows.length > 200) {
                fail('import', 'Solo se permiten 200 filas por importación.');
                return EMPTY;
              }
              return repo.importProducts(rows).pipe(
                tap((result) => {
                  patchState(store, {
                    importing: false,
                    importError: null,
                    importResult: result,
                  });
                  notificationService.showSuccess(
                    `${result.imported} productos importados; ${result.skipped} omitidos.`,
                  );
                }),
                catchError((error: Error) => {
                  fail('import', error.message || 'No se pudo importar el archivo.');
                  return EMPTY;
                }),
              );
            }),
          ),
        ),

        scan: rxMethod<string>(
          pipe(
            tap(() =>
              patchState(store, {
                scanning: true,
                scanError: null,
                scanResult: null,
              }),
            ),
            switchMap((code) => {
              if (!code.trim()) {
                fail('scan', 'Escribe o escanea un código.');
                return EMPTY;
              }
              return repo.scan(code).pipe(
                tap((result) =>
                  patchState(store, {
                    scanning: false,
                    scanError: null,
                    scanResult: result,
                  }),
                ),
                catchError((error: Error) => {
                  fail('scan', error.message || 'No se pudo buscar el código.');
                  return EMPTY;
                }),
              );
            }),
          ),
        ),

        clearSettingsError(): void {
          patchState(store, { settingsError: null });
        },

        clearCombosError(): void {
          patchState(store, { combosError: null });
        },

        clearPromotionsError(): void {
          patchState(store, { promotionsError: null });
        },

        clearMovementsError(): void {
          patchState(store, { movementsError: null });
        },

        acknowledgeSettingsSaved(): void {
          patchState(store, { settingsSaved: false });
        },

        acknowledgeComboSaved(): void {
          patchState(store, { lastComboSaved: null });
        },

        acknowledgeComboRemoved(): void {
          patchState(store, { lastComboRemovedId: null });
        },

        acknowledgePromotionSaved(): void {
          patchState(store, { lastPromotionSaved: null });
        },

        acknowledgePromotionRemoved(): void {
          patchState(store, { lastPromotionRemovedId: null });
        },

        acknowledgeMovementSaved(): void {
          patchState(store, { lastMovementSaved: null });
        },

        clearImport(): void {
          patchState(store, { importResult: null, importError: null });
        },

        clearScan(): void {
          patchState(store, { scanResult: null, scanError: null });
        },

        reset(): void {
          patchState(store, initialState);
        },
      };
    },
  ),
);
