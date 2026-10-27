import { computed, effect, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import { NotificationService } from '../../../../core/services/notification/notification.service';
import { AuthStore } from '../../../auth/public-api';
import {
  buildInventoryCsv,
  buildServiceRow,
  formToServiceCreate,
  formToServiceUpdate,
} from '../../adapters/company-catalog/company-catalog.adapter';
import {
  createCompanyServiceRecord,
  filterCompanyServices,
  findCompanyServiceByCode,
  sanitizeCompanyServices,
  updateCompanyServiceRecord,
} from '../../adapters/company-service/company-service.adapter';
import {
  COMPANY_SERVICE_PAGE_SIZE,
  companyServicesStorageKey,
} from '../../constants/company-services.constants';
import type {
  CompanyCatalogFormValue,
  CompanyCatalogSort,
} from '../../models/company-catalog.model';
import type {
  CompanyService,
  CompanyServiceMutationResult,
  CompanyServiceStatus,
  CreateCompanyServiceData,
  UpdateCompanyServiceData,
} from '../../models/company-service.model';
import type { CompanyServicesState } from './company-services.state';

const initialState: CompanyServicesState = {
  services: [],
  search: '',
  category: '',
  brand: '',
  status: null,
  sort: 'nombre-az',
  page: 1,
  lastSaved: null,
};

/** Lee los servicios locales sin romper la UI si el storage no está disponible. */
function loadStoredCompanyServices(storageKey: string): CompanyService[] {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    return sanitizeCompanyServices(JSON.parse(raw) as unknown);
  } catch {
    return [];
  }
}

/** Persiste los servicios; un storage lleno o bloqueado no rompe la página. */
function persistCompanyServices(storageKey: string, services: readonly CompanyService[]): void {
  try {
    localStorage.setItem(storageKey, JSON.stringify(services));
  } catch {
    // Storage no disponible: los servicios viven solo en memoria.
  }
}

function createServiceId(): string {
  const random = globalThis.crypto?.randomUUID?.();
  if (random) return `srv-${random}`;
  return `srv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Servicios de la empresa (ADR-52/55). Mientras Core Engine no exponga un
 * endpoint de servicios, la cartera se persiste en `localStorage` aislada por
 * tenant y se administra con las mismas reglas de validación que el catálogo
 * de productos. Los derivados viven en `withComputed`.
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
    (store, authStore = inject(AuthStore), notificationService = inject(NotificationService)) => {
      const companyId = (): string => authStore.user()?.tenantId ?? '';

      const createService = (data: CreateCompanyServiceData): CompanyServiceMutationResult => {
        if (findCompanyServiceByCode(store.services(), data.code)) {
          return {
            ok: false,
            message: 'Ya existe un servicio con ese código. Usa uno diferente.',
          };
        }

        const service = createCompanyServiceRecord(data, {
          id: createServiceId(),
          companyId: companyId(),
          now: new Date().toISOString(),
        });
        if (!service) {
          return {
            ok: false,
            message: 'Revisa el código, el precio, el costo y la duración del servicio.',
          };
        }

        patchState(store, {
          services: [service, ...store.services()],
          page: 1,
          lastSaved: service,
        });
        notificationService.showSuccess(`Servicio "${service.name}" creado.`);
        return { ok: true, service };
      };

      const updateService = (
        id: string,
        data: UpdateCompanyServiceData,
      ): CompanyServiceMutationResult => {
        const current = store.services().find((service) => service.id === id);
        if (!current) {
          return { ok: false, message: 'El servicio ya no existe.' };
        }

        const updated = updateCompanyServiceRecord(current, data, new Date().toISOString());
        if (!updated) {
          return {
            ok: false,
            message: 'Revisa el precio, el costo y la duración del servicio.',
          };
        }

        patchState(store, {
          services: store.services().map((service) => (service.id === id ? updated : service)),
          lastSaved: updated,
        });
        notificationService.showSuccess(`Servicio "${updated.name}" actualizado.`);
        return { ok: true, service: updated };
      };

      return {
        create: createService,
        update: updateService,

        remove(id: string): CompanyServiceMutationResult {
          const service = store.services().find((current) => current.id === id);
          if (!service) {
            return { ok: false, message: 'El servicio ya no existe.' };
          }

          patchState(store, {
            services: store.services().filter((current) => current.id !== id),
          });
          notificationService.showSuccess(`Servicio "${service.name}" eliminado.`);
          return { ok: true, service };
        },

        /** Crea un servicio mapeando el payload del modal. */
        createFromForm(form: CompanyCatalogFormValue): CompanyServiceMutationResult {
          return createService(formToServiceCreate(form));
        },

        /** Actualiza un servicio mapeando el payload del modal. */
        updateFromForm(id: string, form: CompanyCatalogFormValue): CompanyServiceMutationResult {
          return updateService(id, formToServiceUpdate(form));
        },

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

        reset(): void {
          patchState(store, initialState);
        },
      };
    },
  ),
  withHooks({
    onInit(store) {
      const authStore = inject(AuthStore);
      const storageKey = companyServicesStorageKey(authStore.user()?.tenantId);
      const stored = loadStoredCompanyServices(storageKey);
      if (stored.length > 0) patchState(store, { services: stored });

      effect(() => {
        persistCompanyServices(storageKey, store.services());
      });
    },
  }),
);
