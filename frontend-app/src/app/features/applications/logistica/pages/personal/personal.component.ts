import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { injectSeoPage } from '../../../../../core/services/seo/seo.service';
import { SkeletonLoaderComponent } from '../../../../../shared/ui/skeleton/skeleton-loader.component';
import {
  FieldEmployee,
  hasLocation,
  personalCargoLabel,
  personalFullName,
  personalStatusLabel,
} from '../../models/personal.model';
import { PersonalStore } from '../../state/personal/personal.store';

/** Personal de logística de campo (ADR-40). */
@Component({
  selector: 'app-personal-page',
  standalone: true,
  imports: [DatePipe, SkeletonLoaderComponent],
  templateUrl: './personal.component.html',
})
export default class PersonalComponent {
  readonly personal = inject(PersonalStore);
  private readonly seoService = injectSeoPage(
    'Repartidores — Logística',
    'Consulta el equipo de reparto, su disponibilidad y su ubicación reportada.',
  );

  readonly fullName = personalFullName;
  readonly cargoLabel = personalCargoLabel;
  readonly statusLabel = personalStatusLabel;
  readonly hasLocation = hasLocation;

  private readonly loadPersonal = this.personal.load();

  onQueryInput(event: Event): void {
    this.personal.setQuery((event.target as HTMLInputElement).value);
  }

  onStatusChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.personal.setStatusFilter(value || null);
  }

  selectEmployee(employee: FieldEmployee): void {
    this.personal.selectEmployee(employee.id);
  }

  statusBadgeClass(status: string): string {
    const base = 'rounded-full px-2.5 py-1 text-[10px] font-black tracking-widest uppercase ';
    if (status === 'en_ruta') {
      return `${base}bg-accent-100 text-accent-800 dark:bg-accent-900/30 dark:text-accent-300`;
    }
    if (status === 'activo') {
      return `${base}bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300`;
    }
    if (status === 'inactivo') {
      return `${base}bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300`;
    }
    return `${base}bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300`;
  }
}
