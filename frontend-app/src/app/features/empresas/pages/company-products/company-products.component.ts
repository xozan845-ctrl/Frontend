import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { injectSeoPage } from '../../../../core/services/seo/seo.service';
import { FocusTrapDirective } from '../../../../shared/directives/focus-trap.directive';
import { AppCurrencyPipe } from '../../../../shared/pipes/app-currency.pipe';
import { CatalogProductsStore } from '../../../products/public-api';
import { CatalogComponent } from '../../../products/public-ui';
import { COMPANY_SERVICE_MAX_DURATION_MINUTES } from '../../constants/company-services.constants';
import type {
  CompanyCatalogTab,
  CompanyService,
  CompanyServiceStatus,
} from '../../models/company-service.model';
import { CompanyServicesStore } from '../../state/company-services/company-services.store';

/**
 * Apartado "Productos / Servicios" del workspace de empresa (ADR-52): reutiliza
 * el catálogo maestro para los productos y administra los servicios locales de
 * la empresa. La página solo orquesta stores; la validación y persistencia
 * viven en `CompanyServicesStore` y su adapter (`R-CX-3`, `R-SO-8`).
 */
@Component({
  selector: 'app-company-products',
  standalone: true,
  imports: [ReactiveFormsModule, CatalogComponent, AppCurrencyPipe, FocusTrapDirective],
  templateUrl: './company-products.component.html',
})
export default class CompanyProductsComponent {
  readonly catalog = inject(CatalogProductsStore);
  readonly services = inject(CompanyServicesStore);
  private readonly fb = inject(FormBuilder);
  private readonly seoService = injectSeoPage(
    'Productos y servicios — Empresa',
    'Administra el catálogo de productos y los servicios que ofrece tu empresa.',
  );

  readonly activeTab = signal<CompanyCatalogTab>('productos');
  readonly serviceFormOpen = signal(false);
  readonly editingService = signal<CompanyService | null>(null);
  readonly serviceError = signal<string | null>(null);
  readonly serviceToDelete = signal<CompanyService | null>(null);

  readonly serviceStatusLabels: Readonly<Record<CompanyServiceStatus, string>> = {
    activo: 'Activo',
    inactivo: 'Inactivo',
  };

  readonly serviceForm = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9-]{2,32}$/)]],
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
    description: ['', [Validators.maxLength(500)]],
    category: ['', [Validators.maxLength(80)]],
    price: ['', [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
    durationMinutes: [
      60,
      [
        Validators.required,
        Validators.min(1),
        Validators.max(COMPANY_SERVICE_MAX_DURATION_MINUTES),
      ],
    ],
    status: ['activo' as CompanyServiceStatus, [Validators.required]],
  });

  setTab(tab: CompanyCatalogTab): void {
    this.activeTab.set(tab);
    this.closeServiceForm();
    this.cancelDelete();
  }

  openCreateService(): void {
    this.editingService.set(null);
    this.serviceError.set(null);
    this.serviceForm.reset({
      code: '',
      name: '',
      description: '',
      category: '',
      price: '',
      durationMinutes: 60,
      status: 'activo',
    });
    this.serviceForm.controls.code.enable();
    this.serviceFormOpen.set(true);
  }

  openEditService(service: CompanyService): void {
    this.editingService.set(service);
    this.serviceError.set(null);
    this.serviceForm.reset({
      code: service.code,
      name: service.name,
      description: service.description,
      category: service.category,
      price: service.price.toFixed(2),
      durationMinutes: service.durationMinutes,
      status: service.status,
    });
    this.serviceForm.controls.code.disable();
    this.serviceFormOpen.set(true);
  }

  closeServiceForm(): void {
    this.serviceFormOpen.set(false);
    this.editingService.set(null);
    this.serviceError.set(null);
  }

  submitService(): void {
    if (this.serviceForm.invalid) {
      this.serviceForm.markAllAsTouched();
      return;
    }

    const { code, name, description, category, price, durationMinutes, status } =
      this.serviceForm.getRawValue();
    const editing = this.editingService();
    const result = editing
      ? this.services.update(editing.id, {
          name,
          description,
          category,
          price,
          durationMinutes,
          status,
        })
      : this.services.create({
          code,
          name,
          description,
          category,
          price,
          durationMinutes,
          status,
        });

    if (!result.ok) {
      this.serviceError.set(result.message ?? 'No se pudo guardar el servicio.');
      return;
    }

    this.closeServiceForm();
  }

  confirmDelete(service: CompanyService): void {
    this.serviceToDelete.set(service);
  }

  cancelDelete(): void {
    this.serviceToDelete.set(null);
  }

  deleteService(): void {
    const service = this.serviceToDelete();
    if (!service) return;
    this.services.remove(service.id);
    this.serviceToDelete.set(null);
  }

  onSearchInput(event: Event): void {
    this.services.setSearch((event.target as HTMLInputElement).value);
  }

  onCategoryFilter(event: Event): void {
    this.services.setCategory((event.target as HTMLSelectElement).value);
  }

  onStatusFilter(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.services.setStatus(value === 'activo' || value === 'inactivo' ? value : null);
  }

  isServiceInvalid(
    field: 'code' | 'name' | 'description' | 'category' | 'price' | 'durationMinutes',
  ): boolean {
    const control = this.serviceForm.controls[field];
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
