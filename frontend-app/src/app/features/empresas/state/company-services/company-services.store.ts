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
  status: null,
  page: 1,
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
 * Servicios de la empresa (ADR-52). Mientras Core Engine no exponga un endpoint
 * de servicios, la cartera se persiste en `localStorage` aislada por tenant y
 * se administra con las mismas reglas de validación que el catálogo de
 * productos. Los derivados (filtros y paginación) viven en `withComputed`.
 */
export const CompanyServicesStore = signalStore(
  withState(initialState),
  withComputed(({ services, search, category, status, page }) => {
    const filteredServices = computed(() =>
      filterCompanyServices(services(), {
        search: search(),
        category: category(),
        status: status(),
      }),
    );
    const filteredCount = computed(() => filteredServices().length);
    const pageCount = computed(() =>
      Math.max(1, Math.ceil(filteredCount() / COMPANY_SERVICE_PAGE_SIZE)),
    );
    const currentPage = computed(() => Math.min(Math.max(1, page()), pageCount()));
    const categories = computed(() =>
      Array.from(
        new Set(
          services()
            .map((service) => service.category)
            .filter(Boolean),
        ),
      ).sort((a, b) => a.localeCompare(b, 'es')),
    );

    return {
      filteredServices,
      filteredCount,
      total: computed(() => services().length),
      pageCount,
      currentPage,
      categories,
      pagedServices: computed(() =>
        filteredServices().slice(
          (currentPage() - 1) * COMPANY_SERVICE_PAGE_SIZE,
          currentPage() * COMPANY_SERVICE_PAGE_SIZE,
        ),
      ),
      hasServices: computed(() => services().length > 0),
      hasFilteredServices: computed(() => filteredCount() > 0),
      hasFilters: computed(
        () => search().trim().length > 0 || category().length > 0 || status() !== null,
      ),
      isFirstPage: computed(() => currentPage() === 1),
      isLastPage: computed(() => currentPage() >= pageCount()),
    };
  }),
  withMethods(
    (store, authStore = inject(AuthStore), notificationService = inject(NotificationService)) => {
      const companyId = (): string => authStore.user()?.tenantId ?? '';

      return {
        /** Registra un servicio y lo deja visible al inicio del listado. */
        create(data: CreateCompanyServiceData): CompanyServiceMutationResult {
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
              message: 'Revisa el código, el precio y la duración del servicio.',
            };
          }

          patchState(store, { services: [service, ...store.services()], page: 1 });
          notificationService.showSuccess(`Servicio "${service.name}" creado.`);
          return { ok: true, service };
        },

        /** Actualiza los datos editables; el código permanece inmutable. */
        update(id: string, data: UpdateCompanyServiceData): CompanyServiceMutationResult {
          const current = store.services().find((service) => service.id === id);
          if (!current) {
            return { ok: false, message: 'El servicio ya no existe.' };
          }

          const updated = updateCompanyServiceRecord(current, data, new Date().toISOString());
          if (!updated) {
            return {
              ok: false,
              message: 'Revisa el precio y la duración del servicio.',
            };
          }

          patchState(store, {
            services: store.services().map((service) => (service.id === id ? updated : service)),
          });
          notificationService.showSuccess(`Servicio "${updated.name}" actualizado.`);
          return { ok: true, service: updated };
        },

        /** Elimina un servicio de la cartera local. */
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

        setSearch(search: string): void {
          patchState(store, { search, page: 1 });
        },

        setCategory(category: string): void {
          patchState(store, { category, page: 1 });
        },

        setStatus(status: CompanyServiceStatus | null): void {
          patchState(store, { status, page: 1 });
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
          patchState(store, { search: '', category: '', status: null, page: 1 });
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
