import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { injectSeoPage } from '../../../../../core/services/seo/seo.service';
import { SkeletonLoaderComponent } from '../../../../../shared/ui/skeleton/skeleton-loader.component';
import { ImageDropzoneComponent } from '../../../../../shared/ui/image-dropzone/image-dropzone.component';
import { AuthStore, isCompanyOwnerRole } from '../../../auth/public-api';
import {
  STORAGE_REPOSITORY,
  StorageService,
  storagePublicObjectUrl,
} from '../../../storage/public-api';
import {
  COMPANY_TYPE_OPTIONS,
  CURRENCY_OPTIONS,
  LOGISTICS_MODE_OPTIONS,
  companyTypeLabel,
  logisticsModeLabel,
} from '../../constants/company.constants';
import { CompanyProfileData, CompanyType, LogisticsMode } from '../../models/company.model';
import { CompanyStore } from '../../state/company/company.store';
import { CompanyLogoStore } from '../../state/company-logo/company-logo.store';

const SLUG_PATTERN = /^[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*$/;
const MAX_LENGTH = {
  taxId: 30,
  legalName: 160,
  commercialName: 160,
  description: 1000,
  phone: 40,
  website: 200,
  address: 300,
  city: 80,
  department: 80,
  country: 80,
  timezone: 64,
  sector: 80,
  legalRepresentative: 160,
  businessHours: 120,
} as const;

/**
 * Gestión de la empresa del empresario (ADR-27): metadatos comerciales y
 * fiscales, slug público, tipo de empresa, modalidad logística y vendedores.
 * La página solo orquesta el `CompanyStore`; las reglas y el HTTP viven en la
 * capa de estado/servicio (`R-CX-3`).
 */
@Component({
  selector: 'app-company-settings',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    DatePipe,
    SkeletonLoaderComponent,
    ImageDropzoneComponent,
  ],
  providers: [CompanyLogoStore, { provide: STORAGE_REPOSITORY, useClass: StorageService }],
  templateUrl: './company-settings.component.html',
})
export default class CompanySettingsComponent {
  readonly companyStore = inject(CompanyStore);
  readonly logoStore = inject(CompanyLogoStore);
  readonly authStore = inject(AuthStore);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cleanup = this.destroyRef.onDestroy(() => this.clearCreateLogoPreview());
  private readonly seoService = injectSeoPage(
    'Empresa — Administración',
    'Administra el perfil comercial, el slug, el tipo de empresa y el equipo de vendedores.',
  );

  readonly logisticsModes = LOGISTICS_MODE_OPTIONS;
  readonly companyTypes = COMPANY_TYPE_OPTIONS;
  readonly currencies = CURRENCY_OPTIONS;
  readonly modeLabel = logisticsModeLabel;
  readonly typeLabel = companyTypeLabel;

  readonly user = this.authStore.user;
  readonly tenantId = computed(() => this.user()?.tenantId ?? null);
  readonly isEmpresario = computed(() => isCompanyOwnerRole(this.user()?.role));
  readonly company = this.companyStore.company;
  readonly loading = this.companyStore.loading;
  readonly saving = this.companyStore.saving;
  readonly uploadingLogo = this.logoStore.uploading;
  readonly error = this.companyStore.error;
  readonly hasCompany = this.companyStore.hasCompany;
  readonly canCreateCompany = computed(() => this.isEmpresario() && !this.tenantId());

  /** Vista previa del logo elegido antes de crear la empresa. */
  readonly createLogoPreview = signal<string | null>(null);
  private pendingLogo: File | null = null;

  /** URL del logo: la derivada por identity o el endpoint público de storage. */
  readonly logoUrl = computed(() => {
    const company = this.company();
    if (!company) return null;
    if (company.logoUrl) return company.logoUrl;
    if (!company.logoObjectId) return null;

    return storagePublicObjectUrl(company.logoObjectId);
  });

  readonly createCompanyForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(160)]],
    slug: [
      '',
      [Validators.minLength(2), Validators.maxLength(80), Validators.pattern(SLUG_PATTERN)],
    ],
    logisticsMode: this.fb.nonNullable.control<LogisticsMode>('plataforma', Validators.required),
    companyType: this.fb.nonNullable.control<CompanyType>('comercial', Validators.required),
    legalName: ['', [Validators.maxLength(MAX_LENGTH.legalName)]],
    commercialName: ['', [Validators.maxLength(MAX_LENGTH.commercialName)]],
    taxId: ['', [Validators.maxLength(MAX_LENGTH.taxId)]],
    phone: ['', [Validators.maxLength(MAX_LENGTH.phone)]],
    contactEmail: ['', [Validators.email]],
    city: ['', [Validators.maxLength(MAX_LENGTH.city)]],
    country: ['Nicaragua', [Validators.maxLength(MAX_LENGTH.country)]],
    currency: ['NIO', [Validators.required, Validators.minLength(3), Validators.maxLength(3)]],
  });

  readonly profileForm = this.fb.nonNullable.group({
    legalName: ['', [Validators.maxLength(MAX_LENGTH.legalName)]],
    commercialName: ['', [Validators.maxLength(MAX_LENGTH.commercialName)]],
    taxId: ['', [Validators.maxLength(MAX_LENGTH.taxId)]],
    description: ['', [Validators.maxLength(MAX_LENGTH.description)]],
    phone: ['', [Validators.maxLength(MAX_LENGTH.phone)]],
    contactEmail: ['', [Validators.email]],
    website: ['', [Validators.maxLength(MAX_LENGTH.website)]],
    address: ['', [Validators.maxLength(MAX_LENGTH.address)]],
    city: ['', [Validators.maxLength(MAX_LENGTH.city)]],
    department: ['', [Validators.maxLength(MAX_LENGTH.department)]],
    country: ['Nicaragua', [Validators.maxLength(MAX_LENGTH.country)]],
    currency: ['NIO', [Validators.required, Validators.minLength(3), Validators.maxLength(3)]],
    timezone: ['America/Managua', [Validators.maxLength(MAX_LENGTH.timezone)]],
    sector: ['', [Validators.maxLength(MAX_LENGTH.sector)]],
    legalRepresentative: ['', [Validators.maxLength(MAX_LENGTH.legalRepresentative)]],
    businessHours: ['', [Validators.maxLength(MAX_LENGTH.businessHours)]],
  });

  readonly slugForm = this.fb.nonNullable.group({
    slug: [
      '',
      [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(80),
        Validators.pattern(SLUG_PATTERN),
      ],
    ],
  });

  readonly typeForm = this.fb.nonNullable.group({
    companyType: this.fb.nonNullable.control<CompanyType>('comercial', Validators.required),
  });

  readonly logisticsForm = this.fb.nonNullable.group({
    logisticsMode: this.fb.nonNullable.control<LogisticsMode>('plataforma', Validators.required),
  });

  /** Carga la empresa del `tenant_id` del JWT (login o refresh posterior al alta). */
  private readonly loadCompany = effect(() => {
    const id = this.tenantId();
    if (!id || this.companyStore.company()?.id === id) return;
    this.companyStore.load(id);
  });

  /** Sube el logo elegido en el alta en cuanto la empresa existe. */
  private readonly uploadPendingLogo = effect(() => {
    const company = this.companyStore.company();
    const file = this.pendingLogo;
    if (!company || !file) return;

    this.pendingLogo = null;
    this.clearCreateLogoPreview();
    this.logoStore.upload(file);
  });

  /** Refleja el nombre de la empresa en la pestaña. */
  private readonly syncTitle = effect(() => {
    const company = this.companyStore.company();
    if (company) {
      this.seoService.updateTitle(`${company.name} — Administración`);
    }
  });

  /** Mantiene los formularios sincronizados con la empresa cargada. */
  private readonly syncCompanyForms = effect(() => {
    const company = this.companyStore.company();
    if (!company) return;

    this.logisticsForm.controls.logisticsMode.setValue(company.logisticsMode);
    this.slugForm.controls.slug.setValue(company.slug ?? '');
    this.typeForm.controls.companyType.setValue(company.type);
    this.profileForm.reset({
      legalName: company.legalName ?? '',
      commercialName: company.commercialName ?? '',
      taxId: company.taxId ?? '',
      description: company.description ?? '',
      phone: company.phone ?? '',
      contactEmail: company.contactEmail ?? '',
      website: company.website ?? '',
      address: company.address ?? '',
      city: company.city ?? '',
      department: company.department ?? '',
      country: company.country ?? 'Nicaragua',
      currency: company.currency ?? 'NIO',
      timezone: company.timezone ?? 'America/Managua',
      sector: company.sector ?? '',
      legalRepresentative: company.legalRepresentative ?? '',
      businessHours: company.businessHours ?? '',
    });
  });

  submitCompany(): void {
    if (!this.isEmpresario() || this.createCompanyForm.invalid || this.saving()) {
      this.createCompanyForm.markAllAsTouched();
      return;
    }

    const raw = this.createCompanyForm.getRawValue();
    const slug = raw.slug.trim().toLowerCase();
    this.companyStore.create({
      name: raw.name.trim(),
      logisticsMode: raw.logisticsMode,
      type: raw.companyType,
      ...(slug ? { slug } : {}),
      ...this.compactProfile({
        legalName: raw.legalName,
        commercialName: raw.commercialName,
        taxId: raw.taxId,
        phone: raw.phone,
        contactEmail: raw.contactEmail,
        city: raw.city,
        country: raw.country,
        currency: raw.currency,
      }),
    });
  }

  submitProfile(): void {
    if (!this.isEmpresario() || this.profileForm.invalid || this.saving()) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const raw = this.profileForm.getRawValue();
    this.companyStore.updateProfile({
      legalName: raw.legalName.trim(),
      commercialName: raw.commercialName.trim(),
      taxId: raw.taxId.trim(),
      description: raw.description.trim(),
      phone: raw.phone.trim(),
      contactEmail: raw.contactEmail.trim(),
      website: raw.website.trim(),
      address: raw.address.trim(),
      city: raw.city.trim(),
      department: raw.department.trim(),
      country: raw.country.trim(),
      currency: raw.currency.trim().toUpperCase(),
      timezone: raw.timezone.trim(),
      sector: raw.sector.trim(),
      legalRepresentative: raw.legalRepresentative.trim(),
      businessHours: raw.businessHours.trim(),
    });
  }

  submitSlug(): void {
    if (!this.isEmpresario() || this.slugForm.invalid || this.saving()) {
      this.slugForm.markAllAsTouched();
      return;
    }

    this.companyStore.updateSlug(this.slugForm.getRawValue().slug.trim().toLowerCase());
  }

  submitType(): void {
    if (!this.isEmpresario() || this.typeForm.invalid || this.saving()) {
      this.typeForm.markAllAsTouched();
      return;
    }

    this.companyStore.updateType(this.typeForm.getRawValue().companyType);
  }

  submitLogistics(): void {
    if (!this.isEmpresario() || this.logisticsForm.invalid || this.saving()) {
      this.logisticsForm.markAllAsTouched();
      return;
    }

    this.companyStore.updateLogistics(this.logisticsForm.getRawValue().logisticsMode);
  }

  /** Stage del logo elegido en el alta; se sube después de crear la empresa. */
  onCreateLogoSelected(file: File): void {
    this.clearCreateLogoPreview();
    this.pendingLogo = file;
    this.createLogoPreview.set(this.objectUrl(file));
  }

  onCreateLogoRemoved(): void {
    this.pendingLogo = null;
    this.clearCreateLogoPreview();
  }

  /** Sube el archivo al storage del tenant y lo asocia como logo. */
  onLogoSelected(file: File): void {
    if (!this.isEmpresario()) return;
    this.logoStore.upload(file);
  }

  /** Desasocia el logo actual; la imagen permanece en storage. */
  removeLogo(): void {
    if (!this.isEmpresario() || this.uploadingLogo()) return;
    this.companyStore.updateProfile({ logoObjectId: null });
  }

  retry(): void {
    const id = this.tenantId();
    if (id) {
      this.companyStore.load(id);
      return;
    }
    this.companyStore.clearError();
  }

  /** Omite metadatos vacíos para no enviar ruido al alta de la empresa. */
  private compactProfile(data: CompanyProfileData): CompanyProfileData {
    return Object.fromEntries(
      Object.entries(data).filter(([, value]) => typeof value === 'string' && value.trim()),
    ) as CompanyProfileData;
  }

  private objectUrl(file: File): string | null {
    try {
      return typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function'
        ? URL.createObjectURL(file)
        : null;
    } catch {
      return null;
    }
  }

  private clearCreateLogoPreview(): void {
    const url = this.createLogoPreview();
    try {
      if (url && typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
        URL.revokeObjectURL(url);
      }
    } catch {
      // La vista previa es opcional; no debe romper el flujo de alta.
    }
    this.createLogoPreview.set(null);
  }
}
