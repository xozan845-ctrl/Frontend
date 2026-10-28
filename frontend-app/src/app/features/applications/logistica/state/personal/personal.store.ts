import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, pipe } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { NotificationService } from '../../../../../core/services/notification/notification.service';
import { FieldEmployee } from '../../models/personal.model';
import { PERSONAL_REPOSITORY } from '../../repositories/personal.repository';
import type { PersonalState } from './personal.state';

const initialState: PersonalState = {
  employees: [],
  loading: false,
  error: null,
  selectedEmployeeId: null,
  query: '',
  statusFilter: null,
};

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

function matches(employee: FieldEmployee, query: string): boolean {
  if (!query) return true;
  return [employee.name, employee.lastName, employee.email, employee.phone]
    .map(normalize)
    .some((value) => value.includes(query));
}

/**
 * Personal de logística de campo (ADR-40): lista el equipo del tenant, permite
 * buscar/filtrar y selecciona un colaborador para ver su ficha.
 */
export const PersonalStore = signalStore(
  withState(initialState),
  withComputed(({ employees, selectedEmployeeId, query, statusFilter }) => ({
    filteredEmployees: computed(() => {
      const needle = normalize(query());
      const status = statusFilter();
      return employees().filter(
        (employee) => (!status || employee.status === status) && matches(employee, needle),
      );
    }),
    selectedEmployee: computed(() => {
      const id = selectedEmployeeId();
      return id ? (employees().find((employee) => employee.id === id) ?? null) : null;
    }),
    totalEmployees: computed(() => employees().length),
    onRouteCount: computed(
      () => employees().filter((employee) => employee.status === 'en_ruta').length,
    ),
    availableCount: computed(
      () =>
        employees().filter(
          (employee) => employee.status === 'activo' || employee.status === 'en_ruta',
        ).length,
    ),
    offlineCount: computed(
      () =>
        employees().filter(
          (employee) => employee.status === 'descansando' || employee.status === 'inactivo',
        ).length,
    ),
  })),
  withMethods(
    (
      store,
      personalRepo = inject(PERSONAL_REPOSITORY),
      notificationService = inject(NotificationService),
    ) => ({
      /** Carga el personal y selecciona el primero si no hay una selección válida. */
      load: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap(() =>
            personalRepo.list().pipe(
              tap((employees) => {
                const current = store.selectedEmployeeId();
                const selected = employees.some((employee) => employee.id === current)
                  ? current
                  : (employees[0]?.id ?? null);
                patchState(store, {
                  employees,
                  selectedEmployeeId: selected,
                  loading: false,
                  error: null,
                });
              }),
              catchError((err: Error) => {
                const message = err.message || 'No se pudo cargar el personal.';
                patchState(store, { loading: false, error: message });
                notificationService.showError(message);
                return EMPTY;
              }),
            ),
          ),
        ),
      ),

      selectEmployee(employeeId: string | null): void {
        patchState(store, { selectedEmployeeId: employeeId });
      },

      setQuery(query: string): void {
        patchState(store, { query });
      },

      setStatusFilter(status: string | null): void {
        patchState(store, { statusFilter: status });
      },

      clearError(): void {
        patchState(store, { error: null });
      },

      reset(): void {
        patchState(store, initialState);
      },
    }),
  ),
);
