import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { throwError } from 'rxjs';
import { tap } from 'rxjs/operators';
import { injectSeoPage } from '@core/services/seo/seo.service';
import { SkeletonLoaderComponent } from '@shared/ui/skeleton/skeleton-loader.component';
import { ImageDropzoneComponent } from '@shared/ui/image-dropzone/image-dropzone.component';
import { MediaBackgroundEditorComponent } from '@shared/ui/media-background-editor/media-background-editor.component';
import { AuthStore, isCompanyOwnerRole } from '../../../auth/public-api';
import {
  STORAGE_REPOSITORY,
  StorageService,
  resolveStorageAssetUrl,
  storagePublicObjectUrl,
} from '../../../storage/public-api';
import {
  MediaBackgroundDraft,
  MediaBackgroundUploadService,
  MediaBackgroundWriteService,
} from '@domains/media-background/public-api';
import {
  COMPANY_TYPE_OPTIONS,
  CURRENCY_OPTIONS,
  LOGISTICS_MODE_OPTIONS,
  companyTypeLabel,
  logisticsModeLabel,
} from '../../constants/company.constants';
import {
  CompanyType,
  CreateCompanyData,
  LogisticsMode,
} from '../../models/company.model';
import { CompanyStore } from '../../state/company/company.store';
import { CompanyLogoStore } from '../../state/company-logo/company-logo.store';
import { MAX_LENGTH, SLUG_PATTERN } from '../../constants/company-form.constants';
import CompanySettingsSummaryComponent from '../../components/company-settings-summary/company-settings-summary.component';
import CompanyCreateFormComponent from '../../components/company-create-form/company-create-form.component';

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
    CompanySettingsSummaryComponent,
    CompanyCreateFormComponent,
    ReactiveFormsModule,
    RouterLink,
    DatePipe,
    SkeletonLoaderComponent,
    ImageDropzoneComponent,
    MediaBackgroundEditorComponent,
  ],
  providers: [
    CompanyLogoStore,
    MediaBackgroundUploadService,
    { provide: STORAGE_REPOSITORY, useClass: StorageService },
  ],
  templateUrl: './company-settings.component.html',
})
export default class CompanySettingsComponent {
  readonly companyStore = inject(CompanyStore);
  readonly logoStore = inject(CompanyLogoStore);
  readonly authStore = inject(AuthStore);
  private readonly mediaWriter = inject(MediaBackgroundWriteService);
  private readonly mediaUploads = inject(MediaBackgroundUploadService);
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
    const resolved = resolveStorageAssetUrl(company.logoUrl);
    if (resolved) return resolved;
    if (!company.logoObjectId) return null;

    return storagePublicObjectUrl(company.logoObjectId);
  });

  readonly subirFondoEmpresa = (file: File) =>
    this.mediaUploads.upload(file, { folder: 'empresas', description: 'Fondo de empresa' });

  /** Guarda el fondo de la empresa; solo se renderiza para el empresario. */
  readonly guardarFondoEmpresa = (draft: MediaBackgroundDraft) => {
    const company = this.company();
    if (!company) return throwError(() => new Error('Empresa no disponible.'));
    return this.mediaWriter
      .updateCompany(company.id, draft)
      .pipe(tap((background) => this.companyStore.applyCompanyUpdate({ ...company, background })));
  };

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

  onCreateCompany(payload: CreateCompanyData): void {
    if (!this.isEmpresario() || this.saving()) return;
    this.companyStore.create(payload);
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
