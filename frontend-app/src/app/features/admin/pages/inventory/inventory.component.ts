import { Component, inject } from '@angular/core';
import { injectSeoPage } from '../../../../core/services/seo/seo.service';
import { AppCurrencyPipe } from '../../../../shared/pipes/app-currency.pipe';
import { SkeletonLoaderComponent } from '../../../../shared/ui/skeleton/skeleton-loader.component';
import { InventoryStore } from '../../state/inventory/inventory.store';

/**
 * Inventario de bodega (ADR-33, solo admin): niveles de stock, reservas y valor
 * del inventario desde `GET /admin/inventario`.
 */
@Component({
  selector: 'app-admin-inventory',
  standalone: true,
  imports: [AppCurrencyPipe, SkeletonLoaderComponent],
  templateUrl: './inventory.component.html',
})
export default class AdminInventoryComponent {
  readonly inventory = inject(InventoryStore);
  private readonly seoService = injectSeoPage(
    'Inventario — Administración',
    'Consulta los niveles de stock, reservas y valor del inventario de la bodega.',
  );

  private readonly loadInventory = this.inventory.load();

  onQueryInput(event: Event): void {
    this.inventory.setQuery((event.target as HTMLInputElement).value);
  }

  onStatusChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.inventory.setStatus(value || null);
  }
}
