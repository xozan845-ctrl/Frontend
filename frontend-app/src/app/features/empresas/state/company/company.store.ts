import { inject, untracked } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, from, pipe } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { NotificationService } from '../../../../core/services/notification.service';
import { AuthStore } from '../../../auth/public-api';
import {
  Company,
  CreateCompanyData,
  CreateCompanySellerData,
  LogisticsMode,
} from '../../models/company.model';
import { COMPANY_REPOSITORY } from '../../repositories/company.repository';
import type { CompanyState } from './company.state';

const initialState: CompanyState = {
  company: null,
  sellers: [],
  loading: false,
  saving: false,
  error: null,
};

/**
 * Estado de la empresa activa del empresario. Vive en la ruta del panel
 * (`R-AR-3`, ADR-21) y habla con la infraestructura por `COMPANY_REPOSITORY`.
 *
 * Crear la empresa cambia el `tenant_id` y el rol del usuario en el backend,
 * por lo que después del alta se renueva la sesión: el JWT viejo no lleva el
 * tenant y `POST /vendedores/tienda` lo exige.
 */
export const CompanyStore = signalStore(
  withState(initialState),
  withComputed(({ company }) => ({
    hasCompany: () => !!company(),
  })),
  withMethods(
    (
      store,
      companyRepo = inject(COMPANY_REPOSITORY),
      authStore = inject(AuthStore),
      notificationService = inject(NotificationService),
    ) => {
      const load = rxMethod<string>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap((id) =>
            companyRepo.getById(id).pipe(
              tap((company) => patchState(store, { company, loading: false, error: null })),
              catchError((err: Error) => {
                const message = err.message || 'No se pudo cargar la empresa.';
                patchState(store, { loading: false, error: message });
                notificationService.showError(message);
                return EMPTY;
              }),
            ),
          ),
        ),
      );

      return {
        /** Carga la empresa por id (normalmente el `tenant_id` del JWT). */
        load,

        /** Crea la empresa y renueva la sesión para obtener el nuevo `tenant_id`. */
        create: rxMethod<CreateCompanyData>(
          pipe(
            tap(() => patchState(store, { saving: true, error: null })),
            switchMap((data) =>
              companyRepo.create(data).pipe(
                switchMap((company) =>
                  from(authStore.refreshTokenOnce()).pipe(
                    tap((renewed) => {
                      const message = renewed
                        ? null
                        : 'La empresa se creó, pero la sesión no se pudo renovar. Inicia sesión de nuevo.';
                      patchState(store, {
                        company,
                        saving: false,
                        error: message,
                      });
                      if (renewed) {
                        notificationService.showSuccess(`Empresa "${company.name}" creada.`);
                      } else {
                        notificationService.showError(message as string);
                      }
                    }),
                  ),
                ),
                catchError((err: Error) => {
                  const message = err.message || 'No se pudo crear la empresa.';
                  patchState(store, { saving: false, error: message });
                  notificationService.showError(message);
                  return EMPTY;
                }),
              ),
            ),
          ),
        ),

        /** Cambia la modalidad logística de la empresa activa. */
        updateLogistics: rxMethod<LogisticsMode>(
          pipe(
            tap(() => patchState(store, { saving: true, error: null })),
            switchMap((mode) => {
              const company = untracked(() => store.company());
              if (!company) return EMPTY;

              return companyRepo.updateLogistics(company.id, mode).pipe(
                tap((updated: Company) => {
                  patchState(store, { company: updated, saving: false, error: null });
                  notificationService.showSuccess('Modalidad logística actualizada.');
                }),
                catchError((err: Error) => {
                  const message = err.message || 'No se pudo actualizar la modalidad logística.';
                  patchState(store, { saving: false, error: message });
                  notificationService.showError(message);
                  return EMPTY;
                }),
              );
            }),
          ),
        ),

        /** Crea un vendedor con participación dentro de la empresa activa. */
        createSeller: rxMethod<CreateCompanySellerData>(
          pipe(
            tap(() => patchState(store, { saving: true, error: null })),
            switchMap((data) => {
              const company = untracked(() => store.company());
              if (!company) return EMPTY;

              return companyRepo.createSeller(company.id, data).pipe(
                tap((seller) => {
                  patchState(store, {
                    sellers: [...untracked(() => store.sellers()), seller],
                    saving: false,
                    error: null,
                  });
                  notificationService.showSuccess(`Vendedor ${seller.name} creado.`);
                }),
                catchError((err: Error) => {
                  const message = err.message || 'No se pudo crear el vendedor.';
                  patchState(store, { saving: false, error: message });
                  notificationService.showError(message);
                  return EMPTY;
                }),
              );
            }),
          ),
        ),

        /** Limpia el error visible sin tocar la empresa cargada. */
        clearError(): void {
          patchState(store, { error: null });
        },

        /** Reinicia el estado (al salir de la pantalla o cambiar de empresa). */
        reset(): void {
          patchState(store, initialState);
        },
      };
    },
  ),
);
