import { Component, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ImageDropzoneComponent } from '@shared/ui/image-dropzone/image-dropzone.component';
import {
  COMPANY_TYPE_OPTIONS,
  CURRENCY_OPTIONS,
  LOGISTICS_MODE_OPTIONS,
} from '../../constants/company.constants';
import { MAX_LENGTH, SLUG_PATTERN } from '../../constants/company-form.constants';
import type {
  CompanyProfileData,
  CompanyType,
  CreateCompanyData,
  LogisticsMode,
} from '../../models/company.model';

/** Alta de empresa del empresario. */
@Component({
  selector: 'app-company-create-form',
  standalone: true,
  imports: [ReactiveFormsModule, ImageDropzoneComponent],
  templateUrl: './company-create-form.component.html',
})
export default class CompanyCreateFormComponent {
  readonly saving = input(false);
  readonly logoPreviewUrl = input<string | null>(null);
  readonly uploadingLogo = input(false);
  readonly createCompany = output<CreateCompanyData>();
  readonly logoSelected = output<File>();
  readonly logoRemoved = output<void>();

  readonly logisticsModes = LOGISTICS_MODE_OPTIONS;
  readonly companyTypes = COMPANY_TYPE_OPTIONS;
  readonly currencies = CURRENCY_OPTIONS;

  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.nonNullable.group({
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

  onSubmit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const slug = raw.slug.trim().toLowerCase();
    this.createCompany.emit({
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

  private compactProfile(data: CompanyProfileData): CompanyProfileData {
    return Object.fromEntries(
      Object.entries(data).filter(([, value]) => typeof value === 'string' && value.trim()),
    ) as CompanyProfileData;
  }
}
