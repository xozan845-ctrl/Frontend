import { Component, effect, inject, signal } from '@angular/core';
import { injectSeoPage } from '../../../../../core/services/seo/seo.service';
import { NotificationService } from '../../../../../core/services/notification/notification.service';
import { FocusTrapDirective } from '../../../../../shared/directives/focus-trap.directive';
import { AppCurrencyPipe } from '../../../../../shared/pipes/app-currency.pipe';
import { CompanyCatalogTableComponent } from '../../components/company-catalog-table/company-catalog-table.component';
import { CompanyProductModalComponent } from '../../components/company-product-modal/company-product-modal.component';
import {
  COMPANY_CATALOG_SORT_LABELS,
  CompanyProductsStore,
  CompanyServicesStore,
  type CompanyCatalogFormValue,
  type CompanyCatalogModalMode,
  type CompanyCatalogRow,
  type CompanyCatalogSort,
  type CompanyCatalogStatusFilter,
  type CompanyCatalogTab,
} from '../../../../empresas/public-api';

/**
 * Catálogo administrable de la empresa (ADR-55): KPIs, pestañas de productos,
 * servicios y materia prima, filtros, tabla y modal de alta/edición. La página
 * solo orquesta los stores; toda la derivación vive en `withComputed`.
 */
@Component({
  selector: 'app-company-products',
  standalone: true,
  imports: [
    CompanyCatalogTableComponent,
    CompanyProductModalComponent,
    AppCurrencyPipe,
    FocusTrapDirective,
  ],
  templateUrl: './company-products.component.html',
})
export default class CompanyProductsComponent {
  readonly products = inject(CompanyProductsStore);
  readonly services = inject(CompanyServicesStore);
  private readonly notification = inject(NotificationService);
  private readonly seoService = injectSeoPage(
    'Productos y servicios — Empresa',
    'Administra tu catálogo, precios, costos y stock.',
  );

  readonly activeTab = signal<CompanyCatalogTab>('productos');
  readonly modalOpen = signal(false);
  readonly modalMode = signal<CompanyCatalogModalMode>('create');
  readonly modalType = signal<'producto' | 'servicio'>('producto');
  readonly editingRow = signal<CompanyCatalogRow | null>(null);
  readonly modalError = signal<string | null>(null);
  readonly serviceToDelete = signal<CompanyCatalogRow | null>(null);

  readonly statusFilters: readonly {
    value: CompanyCatalogStatusFilter;
    label: string;
    icon: string;
  }[] = [
    { value: 'todos', label: 'Todos', icon: 'fa-solid fa-list' },
    { value: 'activos', label: 'Activos', icon: 'fa-solid fa-circle-check' },
    { value: 'inactivos', label: 'Inactivos', icon: 'fa-solid fa-circle-minus' },
    { value: 'stock-bajo', label: 'Stock bajo', icon: 'fa-solid fa-triangle-exclamation' },
  ];

  readonly sortOptions = Object.entries(COMPANY_CATALOG_SORT_LABELS).map(([value, label]) => ({
    value: value as CompanyCatalogSort,
    label,
  }));

  private readonly loadProducts = this.products.load();

  /** Cierra el modal cuando el API confirma la creación/edición del producto. */
  private readonly closeOnProductSaved = effect(() => {
    if (this.products.lastSaved()) {
      this.products.acknowledgeSaved();
      this.closeModal();
    }
  });

  setTab(tab: CompanyCatalogTab): void {
    this.activeTab.set(tab);
    this.cancelDelete();
    if (tab === 'servicios') return;
    this.products.setOnlyRawMaterial(tab === 'materia-prima');
    this.products.setPage(1);
  }

  isStatusActive(filter: CompanyCatalogStatusFilter): boolean {
    return this.activeTab() === 'servicios'
      ? this.services.status() === this.toServiceStatus(filter)
      : this.products.status() === filter;
  }

  setStatusFilter(filter: CompanyCatalogStatusFilter): void {
    if (this.activeTab() === 'servicios') {
      this.services.setStatus(this.toServiceStatus(filter));
      return;
    }
    this.products.setStatus(filter);
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    if (this.activeTab() === 'servicios') this.services.setSearch(value);
    else this.products.setQuery(value);
  }

  onBrandFilter(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    if (this.activeTab() === 'servicios') this.services.setBrand(value);
    else this.products.setBrand(value);
  }

  onSortChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as CompanyCatalogSort;
    if (this.activeTab() === 'servicios') this.services.setSort(value);
    else this.products.setSort(value);
  }

  refresh(): void {
    if (this.activeTab() === 'servicios') {
      this.notification.showInfo('Los servicios locales ya están actualizados.');
      return;
    }
    this.products.load();
  }

  clearFilters(): void {
    if (this.activeTab() === 'servicios') this.services.clearFilters();
    else this.products.clearFilters();
  }

  openNew(): void {
    this.modalMode.set('create');
    this.modalType.set(this.activeTab() === 'servicios' ? 'servicio' : 'producto');
    this.editingRow.set(null);
    this.modalError.set(null);
    this.products.clearError();
    this.modalOpen.set(true);
  }

  openEdit(row: CompanyCatalogRow): void {
    this.modalMode.set('edit');
    this.modalType.set(row.kind);
    this.editingRow.set(row);
    this.modalError.set(null);
    this.products.clearError();
    this.modalOpen.set(true);
  }

  closeModal(): void {
    if (this.products.saving()) return;
    this.modalOpen.set(false);
    this.editingRow.set(null);
    this.modalError.set(null);
  }

  onModalSubmit(form: CompanyCatalogFormValue): void {
    const editing = this.editingRow();
    if (editing) {
      if (editing.kind === 'servicio') {
        const result = this.services.updateFromForm(editing.id, form);
        if (!result.ok) {
          this.modalError.set(result.message ?? 'No se pudo actualizar el servicio.');
          return;
        }
        this.closeModal();
        return;
      }
      this.products.update({ id: editing.id, data: form });
      return;
    }

    if (form.type === 'servicio') {
      const result = this.services.createFromForm(form);
      if (!result.ok) {
        this.modalError.set(result.message ?? 'No se pudo crear el servicio.');
        return;
      }
      this.closeModal();
      return;
    }

    this.products.create(form);
  }

  confirmDelete(row: CompanyCatalogRow): void {
    if (row.kind === 'servicio') this.serviceToDelete.set(row);
  }

  cancelDelete(): void {
    this.serviceToDelete.set(null);
  }

  deleteService(): void {
    const row = this.serviceToDelete();
    if (!row) return;
    this.services.remove(row.id);
    this.serviceToDelete.set(null);
  }

  downloadTemplate(): void {
    this.downloadCsv(this.products.templateCsv(), 'plantilla-productos.csv');
  }

  exportInventory(): void {
    this.downloadCsv(
      this.activeTab() === 'servicios'
        ? this.services.inventoryCsv()
        : this.products.inventoryCsv(),
      'inventario.csv',
    );
  }

  onImportFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.notification.showInfo(
      'La importación de Excel estará disponible en una próxima fase. Mientras tanto usa la plantilla y el alta manual.',
    );
    input.value = '';
  }

  showComingSoon(feature: string): void {
    this.notification.showInfo(`${feature} estará disponible en una próxima fase.`);
  }

  activeRows(): readonly CompanyCatalogRow[] {
    return this.activeTab() === 'servicios' ? this.services.pagedRows() : this.products.pagedRows();
  }

  activeFilteredCount(): number {
    return this.activeTab() === 'servicios'
      ? this.services.filteredCount()
      : this.products.filteredCount();
  }

  activePage(): number {
    return this.activeTab() === 'servicios'
      ? this.services.currentPage()
      : this.products.currentPage();
  }

  activePages(): number {
    return this.activeTab() === 'servicios' ? this.services.pageCount() : this.products.pageCount();
  }

  activeIsFirstPage(): boolean {
    return this.activeTab() === 'servicios'
      ? this.services.isFirstPage()
      : this.products.isFirstPage();
  }

  activeIsLastPage(): boolean {
    return this.activeTab() === 'servicios'
      ? this.services.isLastPage()
      : this.products.isLastPage();
  }

  activeLoading(): boolean {
    return this.activeTab() === 'servicios' ? false : this.products.loading();
  }

  activeSearch(): string {
    return this.activeTab() === 'servicios' ? this.services.search() : this.products.query();
  }

  activeBrand(): string {
    return this.activeTab() === 'servicios' ? this.services.brand() : this.products.brand();
  }

  activeSort(): CompanyCatalogSort {
    return this.activeTab() === 'servicios' ? this.services.sort() : this.products.sort();
  }

  activeBrands(): readonly string[] {
    return this.activeTab() === 'servicios' ? this.services.brands() : this.products.brands();
  }

  allBrands(): readonly string[] {
    return Array.from(new Set([...this.products.brands(), ...this.services.brands()])).sort(
      (a, b) => a.localeCompare(b, 'es'),
    );
  }

  activeEmptyTitle(): string {
    if (this.activeTab() === 'servicios') return 'Aún no hay servicios';
    if (this.activeTab() === 'materia-prima') return 'Sin materia prima aún';
    return 'Sin productos aún';
  }

  activeEmptyDescription(): string {
    if (this.activeTab() === 'servicios') return 'Agrega tu primer servicio para comenzar.';
    if (this.activeTab() === 'materia-prima') {
      return 'Marca un producto como materia prima para verlo aquí.';
    }
    return 'Agrega tu primer producto para comenzar.';
  }

  previousPage(): void {
    if (this.activeTab() === 'servicios') this.services.previousPage();
    else this.products.previousPage();
  }

  nextPage(): void {
    if (this.activeTab() === 'servicios') this.services.nextPage();
    else this.products.nextPage();
  }

  private toServiceStatus(filter: CompanyCatalogStatusFilter): 'activo' | 'inactivo' | null {
    if (filter === 'activos') return 'activo';
    if (filter === 'inactivos') return 'inactivo';
    return null;
  }

  private downloadCsv(content: string, filename: string): void {
    const blob = new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }
}
