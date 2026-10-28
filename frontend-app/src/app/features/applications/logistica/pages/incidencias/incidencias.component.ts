import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { injectSeoPage } from '../../../../../core/services/seo/seo.service';
import { SkeletonLoaderComponent } from '../../../../../shared/ui/skeleton/skeleton-loader.component';
import {
  FieldIncident,
  incidenciaStatusLabel,
  incidenciaTypeLabel,
} from '../../models/incidencia.model';
import { IncidenciasStore } from '../../state/incidencias/incidencias.store';

const INCIDENT_STATES = [
  { value: 'abierta', label: 'Abierta' },
  { value: 'en_progreso', label: 'En progreso' },
  { value: 'resuelta', label: 'Resuelta' },
] as const;

/** Incidencias de logística de campo (ADR-41). */
@Component({
  selector: 'app-incidencias-page',
  standalone: true,
  imports: [DatePipe, SkeletonLoaderComponent],
  templateUrl: './incidencias.component.html',
})
export default class IncidenciasComponent {
  readonly incidencias = inject(IncidenciasStore);
  private readonly seoService = injectSeoPage(
    'Incidencias — Logística',
    'Consulta y resuelve las incidencias reportadas por el equipo de reparto.',
  );

  readonly incidentStates = INCIDENT_STATES;
  readonly typeLabel = incidenciaTypeLabel;
  readonly statusLabel = incidenciaStatusLabel;
  readonly statusDrafts = signal<Partial<Record<string, string>>>({});
  readonly resolutionDrafts = signal<Partial<Record<string, string>>>({});

  private readonly loadIncidents = this.incidencias.load();

  onStatusFilterChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.incidencias.setStatusFilter(value || null);
  }

  selectIncident(incident: FieldIncident): void {
    this.incidencias.selectIncident(incident.id);
  }

  statusFor(incident: FieldIncident): string {
    return this.statusDrafts()[incident.id] ?? incident.status;
  }

  resolutionFor(incident: FieldIncident): string {
    return this.resolutionDrafts()[incident.id] ?? incident.resolution;
  }

  onStatusChange(incident: FieldIncident, event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.statusDrafts.update((drafts) => ({ ...drafts, [incident.id]: value }));
  }

  onResolutionInput(incident: FieldIncident, event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    this.resolutionDrafts.update((drafts) => ({ ...drafts, [incident.id]: value }));
  }

  saveIncident(incident: FieldIncident): void {
    this.incidencias.updateIncident({
      id: incident.id,
      status: this.statusFor(incident),
      resolution: this.resolutionFor(incident).trim() || undefined,
    });
    this.statusDrafts.update((drafts) => {
      const next = { ...drafts };
      delete next[incident.id];
      return next;
    });
    this.resolutionDrafts.update((drafts) => {
      const next = { ...drafts };
      delete next[incident.id];
      return next;
    });
  }

  statusBadgeClass(status: string): string {
    const base = 'rounded-full px-2.5 py-1 text-[10px] font-black tracking-widest uppercase ';
    if (status === 'resuelta') {
      return `${base}bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300`;
    }
    if (status === 'en_progreso') {
      return `${base}bg-accent-100 text-accent-800 dark:bg-accent-900/30 dark:text-accent-300`;
    }
    return `${base}bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300`;
  }
}
