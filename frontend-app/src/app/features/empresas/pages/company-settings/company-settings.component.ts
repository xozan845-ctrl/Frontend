import { Component, computed, effect, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { injectSeoPage } from '../../../../core/services/seo/seo.service';
import { SkeletonLoaderComponent } from '../../../../shared/ui/skeleton/skeleton-loader.component';
import { AuthStore, isCompanyOwnerRole } from '../../../auth/public-api';
import { LOGISTICS_MODE_OPTIONS, logisticsModeLabel } from '../../constants/company.constants';
import { CreateCompanySellerData, LogisticsMode } from '../../models/company.model';
import { CompanyStore } from '../../state/company/company.store';

/**
 * Gestión de la empresa del empresario (ADR-27): alta, modalidad logística y
 * vendedores con participación. La página solo orquesta el `CompanyStore`;
 * las reglas y el HTTP viven en la capa de estado/servicio (`R-CX-3`).
 */
@Component({
  selector: 'app-company-settings',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, DatePipe, SkeletonLoaderComponent],
  templateUrl: './company-settings.component.html',
})
export default class CompanySettingsComponent {
  readonly companyStore = inject(CompanyStore);
  readonly authStore = inject(AuthStore);
  private readonly fb = inject(FormBuilder);
  private readonly seoService = injectSeoPage(
    'Empresa — Administración',
    'Administra tu empresa, la modalidad logística y el equipo de vendedores.',
  );

  readonly logisticsModes = LOGISTICS_MODE_OPTIONS;
  readonly modeLabel = logisticsModeLabel;
  readonly showPassword = signal(false);

  readonly user = this.authStore.user;
  readonly tenantId = computed(() => this.user()?.tenantId ?? null);
  readonly isEmpresario = computed(() => isCompanyOwnerRole(this.user()?.role));
  readonly company = this.companyStore.company;
  readonly sellers = this.companyStore.sellers;
  readonly loading = this.companyStore.loading;
  readonly saving = this.companyStore.saving;
  readonly error = this.companyStore.error;
  readonly hasCompany = this.companyStore.hasCompany;
  readonly canCreateCompany = computed(() => this.isEmpresario() && !this.tenantId());

  readonly createCompanyForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(160)]],
    logisticsMode: this.fb.nonNullable.control<LogisticsMode>('plataforma', Validators.required),
  });

  readonly logisticsForm = this.fb.nonNullable.group({
    logisticsMode: this.fb.nonNullable.control<LogisticsMode>('plataforma', Validators.required),
  });

  readonly sellerForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    participationPercentage: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
  });

  /** Carga la empresa del `tenant_id` del JWT (login o refresh posterior al alta). */
  private readonly loadCompany = effect(() => {
    const id = this.tenantId();
    if (!id || this.companyStore.company()?.id === id) return;
    this.companyStore.load(id);
  });

  /** Mantiene el select de logística sincronizado con la empresa cargada. */
  private readonly syncLogisticsForm = effect(() => {
    const company = this.companyStore.company();
    if (company) {
      this.logisticsForm.controls.logisticsMode.setValue(company.logisticsMode);
    }
  });

  private lastSellerCount = this.companyStore.sellers().length;

  /** Limpia el alta de vendedor cuando el store confirma uno nuevo. */
  private readonly resetSellerForm = effect(() => {
    const count = this.companyStore.sellers().length;
    if (count > this.lastSellerCount) {
      this.sellerForm.reset({
        name: '',
        email: '',
        password: '',
        participationPercentage: 0,
      });
      this.showPassword.set(false);
    }
    this.lastSellerCount = count;
  });

  submitCompany(): void {
    if (!this.isEmpresario() || this.createCompanyForm.invalid || this.saving()) {
      this.createCompanyForm.markAllAsTouched();
      return;
    }

    const { name, logisticsMode } = this.createCompanyForm.getRawValue();
    this.companyStore.create({ name, logisticsMode });
  }

  submitLogistics(): void {
    if (!this.isEmpresario() || this.logisticsForm.invalid || this.saving()) {
      this.logisticsForm.markAllAsTouched();
      return;
    }

    this.companyStore.updateLogistics(this.logisticsForm.getRawValue().logisticsMode);
  }

  submitSeller(): void {
    if (!this.isEmpresario() || this.sellerForm.invalid || this.saving()) {
      this.sellerForm.markAllAsTouched();
      return;
    }

    const { name, email, password, participationPercentage } = this.sellerForm.getRawValue();
    const payload: CreateCompanySellerData = {
      name,
      email,
      password,
      participationPercentage,
    };
    this.companyStore.createSeller(payload);
  }

  retry(): void {
    const id = this.tenantId();
    if (id) {
      this.companyStore.load(id);
      return;
    }
    this.companyStore.clearError();
  }
}
