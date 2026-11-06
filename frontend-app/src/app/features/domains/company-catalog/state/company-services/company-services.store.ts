import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, pipe } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { NotificationService } from '../../../../../core/services/notification/notification.service';
import {
  buildInventoryCsv,
  buildServiceRow,
  formToServiceCreate,
  formToServiceUpdate,
} from '../../adapters/company-catalog/company-catalog.adapter';
import {
  filterCompanyServices,
  findCompanyServiceByCode,
  normalizeCompanyServiceCode,
  parseCompanyServiceDuration,
  parseCompanyServicePrice,
} from '../../adapters/company-service/company-service.adapter';
import {
  COMPANY_SERVICE_MAX_DURATION_MINUTES,
  COMPANY_SERVICE_PAGE_SIZE,
} from '../../constants/company-services.constants';
import type {
  CompanyCatalogFormValue,
  CompanyCatalogSort,
} from '../../models/company-catalog.model';
import type { CompanyServiceStatus } from '../../models/company-service.model';
import { COMPANY_SERVICE_REPOSITORY } from '../../repositories/company-service.repository';
import type { CompanyServicesState } from './company-services.state';

const initialState: CompanyServicesState = {
  services: [],
  search: '',
  category: '',
  brand: '',
  status: null,
  sort: 'nombre-az',
  page: 1,
  loading: false,
  saving: false,
  error: null,
  lastSaved: null,
  lastRemovedId: null,
};

/** Valida el formulario antes de llamar al backend; `null` si es válido. */
function validateServiceForm(form: CompanyCatalogFormValue): string | null {
  const code = normalizeCompanyServiceCode(form.code);
  if (!/^[A-Za-z0-9-]{2,32}$/.test(code)) {
    return 'Usa un código de 2 a 32 letras, números o guiones.';
  }
  if (!form.name.trim()) return 'Escribe el nombre del servicio.';
  if (parseCompanyServicePrice(form.price) === null) return 'Revisa el precio del servicio.';
  if (form.cost.trim() && parseCompanyServicePrice(form.cost) === null) {
    return 'Revisa el costo del servicio.';
  }
  if (parseCompanyServiceDuration(form.durationMinutes) === null) {
    return `La duración debe estar entre 1 y ${COMPANY_SERVICE_MAX_DURATION_MINUTES} minutos.`;
  }
  return null;
}

/**
 * Servicios de la empresa (ADR-52, R-PS-02). El listado y las mutaciones van
 * al backend; el store solo deriva filtros, orden, paginación y CSV. Después
 * de cada mutación se usa la respuesta del API para no confirmar estado local.
 */
export const CompanyServicesStore = signalStore(
  withState(initialState),
  withComputed(({ services, search, category, brand, status, sort, page }) => {
    const filteredServices = computed(() =>
      filterCompanyServices(services(), {
        search: search(),
        category: category(),
        brand: brand(),
        status: status(),
        sort: sort(),
      }),
    );
    const filteredCount = computed(() => filteredServices().length);
    const pageCount = computed(() =>
      Math.max(1, Math.ceil(filteredCount() / COMPANY_SERVICE_PAGE_SIZE)),
    );
    const currentPage = computed(() => Math.min(Math.max(1, page()), pageCount()));
    const pagedServices = computed(() =>
      filteredServices().slice(
        (currentPage() - 1) * COMPANY_SERVICE_PAGE_SIZE,
        currentPage() * COMPANY_SERVICE_PAGE_SIZE,
      ),
    );

    return {
      filteredServices,
      filteredCount,
      total: computed(() => services().length),
      activeCount: computed(
        () => services().filter((service) => service.status === 'activo').length,
      ),
      pageCount,
      currentPage,
      categories: computed(() =>
        Array.from(
          new Set(
            services()
              .map((service) => service.category)
              .filter(Boolean),
          ),
        ).sort((a, b) => a.localeCompare(b, 'es')),
      ),
      brands: computed(() =>
        Array.from(
          new Set(
            services()
              .map((service) => service.brand)
              .filter(Boolean),
          ),
        ).sort((a, b) => a.localeCompare(b, 'es')),
      ),
      serviceRows: computed(() => filteredServices().map(buildServiceRow)),
      pagedServices,
      pagedRows: computed(() => pagedServices().map(buildServiceRow)),
      hasServices: computed(() => services().length > 0),
      hasFilteredServices: computed(() => filteredCount() > 0),
      hasFilters: computed(
        () =>
          search().trim().length > 0 ||
          category().length > 0 ||
          brand().length > 0 ||
          status() !== null,
      ),
      isFirstPage: computed(() => currentPage() === 1),
      isLastPage: computed(() => currentPage() >= pageCount()),
    };
  }),
  withMethods(
    (
      store,
      repo = inject(COMPANY_SERVICE_REPOSITORY),
      notificationService = inject(NotificationService),
    ) => {
      const fail = (message: string) => {
        patchState(store, { loading: false, saving: false, error: message });
        notificationService.showError(message);
      };

      return {
        /** Carga la cartera remota; se llama al entrar a la pestaña Servicios. */
        load: rxMethod<void>(
          pipe(
            tap(() => patchState(store, { loading: true, error: null })),
            switchMap(() =>
              repo.list().pipe(
                tap((services) => patchState(store, { services, loading: false, error: null })),
                catchError((err: Error) => {
                  fail(err.message || 'No se pudieron cargar los servicios.');
                  return EMPTY;
                }),
              ),
            ),
          ),
        ),

        create: rxMethod<CompanyCatalogFormValue>(
          pipe(
            tap(() => patchState(store, { saving: true, error: null })),
            switchMap((form) => {
              const validationError = validateServiceForm(form);
              if (validationError) {
                fail(validationError);
                return EMPTY;
              }

              const code = normalizeCompanyServiceCode(form.code);
              if (findCompanyServiceByCode(store.services(), code)) {
                fail('Ya existe un servicio con ese código. Usa uno diferente.');
                return EMPTY;
              }

              return repo.create(formToServiceCreate(form)).pipe(
                tap((service) => {
                  patchState(store, {
                    services: [
                      service,
                      ...store.services().filter((current) => current.id !== service.id),
                    ],
                    page: 1,
                    saving: false,
                    error: null,
                    lastSaved: service,
                  });
                  notificationService.showSuccess(`Servicio "${service.name}" creado.`);
                }),
                catchError((err: Error) => {
                  fail(err.message || 'No se pudo crear el servicio.');
                  return EMPTY;
                }),
              );
            }),
          ),
        ),

        update: rxMethod<{ id: string; form: CompanyCatalogFormValue }>(
          pipe(
            tap(() => patchState(store, { saving: true, error: null })),
            switchMap(({ id, form }) => {
              if (!store.services().some((service) => service.id === id)) {
                fail('El servicio ya no existe.');
                return EMPTY;
              }

              const validationError = validateServiceForm(form);
              if (validationError) {
                fail(validationError);
                return EMPTY;
              }

              return repo.update(id, formToServiceUpdate(form)).pipe(
                tap((service) => {
                  patchState(store, {
                    services: store
                      .services()
                      .map((current) => (current.id === id ? service : current)),
                    saving: false,
                    error: null,
                    lastSaved: service,
                  });
                  notificationService.showSuccess(`Servicio "${service.name}" actualizado.`);
                }),
                catchError((err: Error) => {
                  fail(err.message || 'No se pudo actualizar el servicio.');
                  return EMPTY;
                }),
              );
            }),
          ),
        ),

        remove: rxMethod<string>(
          pipe(
            tap(() => patchState(store, { saving: true, error: null })),
            switchMap((id) => {
              const service = store.services().find((current) => current.id === id);
              if (!service) {
                fail('El servicio ya no existe.');
                return EMPTY;
              }

              return repo.remove(id).pipe(
                tap(() => {
                  patchState(store, {
                    services: store.services().filter((current) => current.id !== id),
                    saving: false,
                    error: null,
                    lastRemovedId: id,
                  });
                  notificationService.showSuccess(`Servicio "${service.name}" eliminado.`);
                }),
                catchError((err: Error) => {
                  fail(err.message || 'No se pudo eliminar el servicio.');
                  return EMPTY;
                }),
              );
            }),
          ),
        ),

        /** CSV de los servicios filtrados (misma forma que el inventario). */
        inventoryCsv(): string {
          return buildInventoryCsv(store.serviceRows());
        },

        setSearch(search: string): void {
          patchState(store, { search, page: 1 });
        },

        setCategory(category: string): void {
          patchState(store, { category, page: 1 });
        },

        setBrand(brand: string): void {
          patchState(store, { brand, page: 1 });
        },

        setStatus(status: CompanyServiceStatus | null): void {
          patchState(store, { status, page: 1 });
        },

        setSort(sort: CompanyCatalogSort): void {
          patchState(store, { sort, page: 1 });
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
          patchState(store, {
            search: '',
            category: '',
            brand: '',
            status: null,
            sort: 'nombre-az',
            page: 1,
          });
        },

        acknowledgeSaved(): void {
          patchState(store, { lastSaved: null });
        },

        acknowledgeRemoved(): void {
          patchState(store, { lastRemovedId: null });
        },

        clearError(): void {
          patchState(store, { error: null });
        },

        reset(): void {
          patchState(store, initialState);
        },
      };
    },
  ),
);
