import { Component, effect, inject, signal } from '@angular/core';
import { injectSeoPage } from '../../../../../core/services/seo/seo.service';
import { FocusTrapDirective } from '../../../../../shared/directives/focus-trap.directive';
import { AppCurrencyPipe } from '../../../../../shared/pipes/app-currency.pipe';
import { AppDatePipe } from '../../../../../shared/pipes/app-date.pipe';
import { CompanyCatalogTableComponent } from '../../components/company-catalog-table/company-catalog-table.component';
import { CompanyComboModalComponent } from '../../components/company-combo-modal/company-combo-modal.component';
import { CompanyImportProductsModalComponent } from '../../components/company-import-products-modal/company-import-products-modal.component';
import { CompanyInventoryMovementModalComponent } from '../../components/company-inventory-movement-modal/company-inventory-movement-modal.component';
import { CompanyInventorySettingsModalComponent } from '../../components/company-inventory-settings-modal/company-inventory-settings-modal.component';
import { CompanyProductModalComponent } from '../../components/company-product-modal/company-product-modal.component';
import { CompanyPromotionModalComponent } from '../../components/company-promotion-modal/company-promotion-modal.component';
import { CompanyScanModalComponent } from '../../components/company-scan-modal/company-scan-modal.component';
import {
  buildProductRow,
  buildServiceRow,
  COMPANY_CATALOG_SORT_LABELS,
  CompanyCatalogOperationsStore,
  CompanyProductsStore,
  CompanyServicesStore,
  type CompanyCatalogFormValue,
  type CompanyCatalogModalMode,
  type CompanyCatalogRow,
  type CompanyCatalogSort,
  type CompanyCatalogStatusFilter,
  type CompanyCatalogTab,
  type CompanyCombo,
  type CompanyComboFormValue,
  type CompanyInventoryMovementFormValue,
  type CompanyInventoryMovementType,
  type CompanyInventorySettingsFormValue,
  type CompanyProductImportRow,
  type CompanyPromotion,
  type CompanyPromotionFormValue,
  type CompanyScanResult,
} from '../../../../applications/empresas/public-api';

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
    CompanyComboModalComponent,
    CompanyImportProductsModalComponent,
    CompanyInventoryMovementModalComponent,
    CompanyInventorySettingsModalComponent,
    CompanyPromotionModalComponent,
    CompanyScanModalComponent,
    AppCurrencyPipe,
    AppDatePipe,
    FocusTrapDirective,
  ],
  templateUrl: './company-products.component.html',
})
export default class CompanyProductsComponent {
  readonly products = inject(CompanyProductsStore);
  readonly services = inject(CompanyServicesStore);
  readonly operations = inject(CompanyCatalogOperationsStore);
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

  readonly settingsOpen = signal(false);
  readonly importOpen = signal(false);
  readonly scanOpen = signal(false);

  readonly comboOpen = signal(false);
  readonly comboMode = signal<'create' | 'edit'>('create');
  readonly editingCombo = signal<CompanyCombo | null>(null);
  readonly comboError = signal<string | null>(null);
  readonly comboToDelete = signal<CompanyCombo | null>(null);

  readonly promotionOpen = signal(false);
  readonly promotionMode = signal<'create' | 'edit'>('create');
  readonly editingPromotion = signal<CompanyPromotion | null>(null);
  readonly promotionError = signal<string | null>(null);
  readonly promotionToDelete = signal<CompanyPromotion | null>(null);

  readonly movementOpen = signal(false);
  readonly movementInitialType = signal<CompanyInventoryMovementType>('entrada');

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
  private readonly loadServices = this.services.load();
  private readonly loadCombos = this.operations.loadCombos();
  private readonly loadPromotions = this.operations.loadPromotions();
  private readonly loadMovements = this.operations.loadMovements();

  /** Cierra el modal cuando el API confirma la creación/edición del producto. */
  private readonly closeOnProductSaved = effect(() => {
    if (this.products.lastSaved()) {
      this.products.acknowledgeSaved();
      this.closeModal();
    }
  });

  /** Cierra el modal cuando el API confirma el servicio. */
  private readonly closeOnServiceSaved = effect(() => {
    if (this.services.lastSaved()) {
      this.services.acknowledgeSaved();
      this.closeModal();
    }
  });

  /** Cierra el diálogo de baja solo cuando el backend confirmó la eliminación. */
  private readonly closeOnServiceRemoved = effect(() => {
    if (this.services.lastRemovedId()) {
      this.services.acknowledgeRemoved();
      this.serviceToDelete.set(null);
    }
  });

  private readonly closeOnSettingsSaved = effect(() => {
    if (this.operations.settingsSaved()) {
      this.operations.acknowledgeSettingsSaved();
      this.settingsOpen.set(false);
    }
  });

  private readonly closeOnComboSaved = effect(() => {
    if (this.operations.lastComboSaved()) {
      this.operations.acknowledgeComboSaved();
      this.comboOpen.set(false);
      this.editingCombo.set(null);
    }
  });

  private readonly closeOnComboRemoved = effect(() => {
    if (this.operations.lastComboRemovedId()) {
      this.operations.acknowledgeComboRemoved();
      this.comboToDelete.set(null);
    }
  });

  private readonly closeOnPromotionSaved = effect(() => {
    if (this.operations.lastPromotionSaved()) {
      this.operations.acknowledgePromotionSaved();
      this.promotionOpen.set(false);
      this.editingPromotion.set(null);
    }
  });

  private readonly closeOnPromotionRemoved = effect(() => {
    if (this.operations.lastPromotionRemovedId()) {
      this.operations.acknowledgePromotionRemoved();
      this.promotionToDelete.set(null);
    }
  });

  private readonly closeOnMovementSaved = effect(() => {
    if (this.operations.lastMovementSaved()) {
      this.operations.acknowledgeMovementSaved();
      this.movementOpen.set(false);
      this.products.load();
    }
  });

  /** Tras importar, refresca el catálogo para no mostrar una lista obsoleta. */
  private readonly reloadProductsOnImport = effect(() => {
    const result = this.operations.importResult();
    if (result && result.imported > 0) this.products.load();
  });

  setTab(tab: CompanyCatalogTab): void {
    this.activeTab.set(tab);
    this.cancelDelete();
    if (tab === 'servicios') {
      this.services.load();
      return;
    }
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
      this.services.load();
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
    this.services.clearError();
    this.modalOpen.set(true);
  }

  openEdit(row: CompanyCatalogRow): void {
    this.modalMode.set('edit');
    this.modalType.set(row.kind);
    this.editingRow.set(row);
    this.modalError.set(null);
    this.products.clearError();
    this.services.clearError();
    this.modalOpen.set(true);
  }

  closeModal(): void {
    if (this.activeSaving()) return;
    this.modalOpen.set(false);
    this.editingRow.set(null);
    this.modalError.set(null);
  }

  onModalSubmit(form: CompanyCatalogFormValue): void {
    const editing = this.editingRow();
    if (editing) {
      if (editing.kind === 'servicio') {
        this.services.update({ id: editing.id, form });
        return;
      }
      this.products.update({ id: editing.id, data: form });
      return;
    }

    if (form.type === 'servicio') {
      this.services.create(form);
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
  }

  openSettings(): void {
    this.operations.clearSettingsError();
    this.operations.loadSettings();
    this.settingsOpen.set(true);
  }

  onSettingsSubmit(form: CompanyInventorySettingsFormValue): void {
    this.operations.saveSettings(form);
  }

  closeSettings(): void {
    if (this.operations.settingsSaving()) return;
    this.settingsOpen.set(false);
  }

  openImport(): void {
    this.operations.clearImport();
    this.importOpen.set(true);
  }

  onImportRows(rows: readonly CompanyProductImportRow[]): void {
    this.operations.importProducts(rows);
  }

  closeImport(): void {
    if (this.operations.importing()) return;
    this.importOpen.set(false);
    this.operations.clearImport();
  }

  openScan(): void {
    this.operations.clearScan();
    this.scanOpen.set(true);
  }

  onScan(code: string): void {
    this.operations.scan(code);
  }

  onScanEdit(result: CompanyScanResult): void {
    this.scanOpen.set(false);
    if (result.kind === 'producto' && result.product) {
      this.openEdit(buildProductRow(result.product));
      return;
    }
    if (result.service) this.openEdit(buildServiceRow(result.service));
  }

  closeScan(): void {
    if (this.operations.scanning()) return;
    this.scanOpen.set(false);
    this.operations.clearScan();
  }

  openNewCombo(): void {
    this.comboMode.set('create');
    this.editingCombo.set(null);
    this.comboError.set(null);
    this.operations.clearCombosError();
    this.comboOpen.set(true);
  }

  openEditCombo(combo: CompanyCombo): void {
    this.comboMode.set('edit');
    this.editingCombo.set(combo);
    this.comboError.set(null);
    this.operations.clearCombosError();
    this.comboOpen.set(true);
  }

  onComboSubmit(form: CompanyComboFormValue): void {
    const editing = this.editingCombo();
    if (editing) {
      this.operations.updateCombo({ id: editing.id, form });
      return;
    }
    this.operations.createCombo(form);
  }

  closeCombo(): void {
    if (this.operations.combosSaving()) return;
    this.comboOpen.set(false);
    this.editingCombo.set(null);
  }

  confirmDeleteCombo(combo: CompanyCombo): void {
    this.comboToDelete.set(combo);
  }

  cancelDeleteCombo(): void {
    this.comboToDelete.set(null);
  }

  deleteCombo(): void {
    const combo = this.comboToDelete();
    if (combo) this.operations.removeCombo(combo.id);
  }

  openNewPromotion(): void {
    this.promotionMode.set('create');
    this.editingPromotion.set(null);
    this.promotionError.set(null);
    this.operations.clearPromotionsError();
    this.promotionOpen.set(true);
  }

  openEditPromotion(promotion: CompanyPromotion): void {
    this.promotionMode.set('edit');
    this.editingPromotion.set(promotion);
    this.promotionError.set(null);
    this.operations.clearPromotionsError();
    this.promotionOpen.set(true);
  }

  onPromotionSubmit(form: CompanyPromotionFormValue): void {
    const editing = this.editingPromotion();
    if (editing) {
      this.operations.updatePromotion({ id: editing.id, form });
      return;
    }
    this.operations.createPromotion(form);
  }

  closePromotion(): void {
    if (this.operations.promotionsSaving()) return;
    this.promotionOpen.set(false);
    this.editingPromotion.set(null);
  }

  confirmDeletePromotion(promotion: CompanyPromotion): void {
    this.promotionToDelete.set(promotion);
  }

  cancelDeletePromotion(): void {
    this.promotionToDelete.set(null);
  }

  deletePromotion(): void {
    const promotion = this.promotionToDelete();
    if (promotion) this.operations.removePromotion(promotion.id);
  }

  openMovement(type: CompanyInventoryMovementType = 'entrada'): void {
    this.movementInitialType.set(type);
    this.operations.clearMovementsError();
    this.movementOpen.set(true);
  }

  onMovementSubmit(form: CompanyInventoryMovementFormValue): void {
    this.operations.createMovement(form);
  }

  closeMovement(): void {
    if (this.operations.movementsSaving()) return;
    this.movementOpen.set(false);
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
    return this.activeTab() === 'servicios' ? this.services.loading() : this.products.loading();
  }

  activeSaving(): boolean {
    return this.activeTab() === 'servicios' ? this.services.saving() : this.products.saving();
  }

  activeError(): string | null {
    return this.activeTab() === 'servicios' ? this.services.error() : this.products.error();
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
