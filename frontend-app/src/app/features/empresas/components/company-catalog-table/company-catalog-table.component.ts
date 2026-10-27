import { Component, input, output } from '@angular/core';
import { AppCurrencyPipe } from '../../../../shared/pipes/app-currency.pipe';
import { AppDatePipe } from '../../../../shared/pipes/app-date.pipe';
import { SkeletonLoaderComponent } from '../../../../shared/ui/skeleton/skeleton-loader.component';
import type { CompanyCatalogRow, CompanyCatalogTab } from '../../models/company-catalog.model';

/**
 * Tabla presentacional del catálogo. Muestra productos, servicios o materia
 * prima y emite las acciones de edición/borrado; no conoce stores (R-SO-8).
 */
@Component({
  selector: 'app-company-catalog-table',
  standalone: true,
  imports: [AppCurrencyPipe, AppDatePipe, SkeletonLoaderComponent],
  templateUrl: './company-catalog-table.component.html',
})
export class CompanyCatalogTableComponent {
  readonly rows = input<readonly CompanyCatalogRow[]>([]);
  readonly tab = input<CompanyCatalogTab>('productos');
  readonly loading = input(false);
  readonly emptyTitle = input('Sin productos aún');
  readonly emptyDescription = input('Agrega tu primer producto para comenzar.');

  readonly edit = output<CompanyCatalogRow>();
  readonly remove = output<CompanyCatalogRow>();
  readonly create = output<void>();

  isService(): boolean {
    return this.tab() === 'servicios';
  }
}
