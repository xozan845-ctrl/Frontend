import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { injectSeoPage } from '../../../../core/services/seo/seo.service';
import { SkeletonLoaderComponent } from '../../../../shared/ui/skeleton/skeleton-loader.component';
import {
  Parada,
  Ruta,
  paradaTypeLabel,
  rutaProgress,
  rutaStatusLabel,
} from '../../models/ruta.model';
import { RutasStore } from '../../state/rutas/rutas.store';

const ROUTE_STATES = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'en_curso', label: 'En curso' },
  { value: 'completada', label: 'Completada' },
  { value: 'cancelada', label: 'Cancelada' },
] as const;

/** Rutas y paradas de logística de campo (ADR-39). */
@Component({
  selector: 'app-rutas-page',
  standalone: true,
  imports: [DatePipe, SkeletonLoaderComponent],
  templateUrl: './rutas.component.html',
})
export default class RutasComponent {
  readonly rutas = inject(RutasStore);
  private readonly seoService = injectSeoPage(
    'Rutas — Logística',
    'Consulta las rutas de reparto, su avance y el estado de cada parada.',
  );

  readonly routeStates = ROUTE_STATES;
  readonly statusLabel = rutaStatusLabel;
  readonly stopTypeLabel = paradaTypeLabel;
  readonly progress = rutaProgress;
  readonly statusFilter = this.rutas.statusFilter;
  readonly filteredRoutes = this.rutas.filteredRoutes;
  readonly statusDrafts = signal<Record<string, string>>({});

  private readonly loadRoutes = this.rutas.load();

  statusBadgeClass(status: string): string {
    const base = 'rounded-full px-2.5 py-1 text-[10px] font-black tracking-widest uppercase ';
    if (status === 'en_curso') {
      return `${base}bg-accent-100 text-accent-800 dark:bg-accent-900/30 dark:text-accent-300`;
    }
    if (status === 'completada') {
      return `${base}bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300`;
    }
    if (status === 'cancelada') {
      return `${base}bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300`;
    }
    return `${base}bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300`;
  }

  onStatusFilterChange(event: Event): void {
    this.rutas.setStatusFilter((event.target as HTMLSelectElement).value);
  }

  selectRoute(route: Ruta): void {
    this.rutas.selectRoute(route.id);
  }

  statusFor(route: Ruta): string {
    return this.statusDrafts()[route.id] ?? route.status;
  }

  onRouteStatusChange(route: Ruta, event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.statusDrafts.update((drafts) => ({ ...drafts, [route.id]: value }));
  }

  saveStatus(route: Ruta): void {
    this.rutas.updateStatus({ routeId: route.id, status: this.statusFor(route) });
    this.statusDrafts.update((drafts) => {
      const next = { ...drafts };
      delete next[route.id];
      return next;
    });
  }

  toggleStop(route: Ruta, stop: Parada): void {
    this.rutas.toggleStop({ routeId: route.id, stop });
  }
}
