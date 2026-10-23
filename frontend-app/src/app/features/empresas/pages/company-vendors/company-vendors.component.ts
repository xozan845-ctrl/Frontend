import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { injectSeoPage } from '../../../../core/services/seo/seo.service';
import { NotificationService } from '../../../../core/services/notification/notification.service';
import { SkeletonLoaderComponent } from '../../../../shared/ui/skeleton/skeleton-loader.component';
import { AuthStore } from '../../../auth/public-api';
import { CompanyStore } from '../../state/company/company.store';
import { CompanyPortalStore } from '../../state/company-portal/company-portal.store';
import { CompanyInvitationsStore } from '../../state/company-invitations/company-invitations.store';

/** Gestión de vendedores e invitaciones del empresario. */
@Component({
  selector: 'app-company-vendors',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, DatePipe, SkeletonLoaderComponent],
  templateUrl: './company-vendors.component.html',
})
export default class CompanyVendorsComponent {
  readonly companyStore = inject(CompanyStore);
  readonly portal = inject(CompanyPortalStore);
  readonly vendors = inject(CompanyInvitationsStore);
  readonly authStore = inject(AuthStore);
  private readonly fb = inject(FormBuilder);
  private readonly notifications = inject(NotificationService);
  private readonly seoService = injectSeoPage(
    'Vendedores — Empresa',
    'Invita y administra vendedores asociados a las tiendas de tu empresa.',
  );

  readonly company = this.companyStore.company;
  readonly tenantId = computed(() => this.authStore.user()?.tenantId ?? null);
  readonly availableStores = this.portal.availableStores;

  readonly invitationForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    storeId: ['', Validators.required],
    participationPercentage: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
  });

  private loadedCompanyId = '';
  private readonly loadWorkspace = effect(() => {
    const companyId = this.tenantId();
    if (!companyId || this.loadedCompanyId === companyId) return;
    this.loadedCompanyId = companyId;
    this.companyStore.load(companyId);
    this.portal.loadStores();
    this.vendors.load(companyId);
  });

  submitInvitation(): void {
    if (this.invitationForm.invalid || this.vendors.saving()) {
      this.invitationForm.markAllAsTouched();
      return;
    }

    const companyId = this.tenantId();
    if (!companyId) return;

    const { email, storeId, participationPercentage } = this.invitationForm.getRawValue();
    this.vendors.createInvitation({
      companyId,
      data: {
        email: email.trim(),
        storeId,
        participationPercentage,
      },
    });
  }

  async copyInvitation(): Promise<void> {
    const url = this.vendors.lastInvitation()?.invitationUrl;
    if (!url) return;

    try {
      await navigator.clipboard.writeText(url);
      this.notifications.showSuccess('URL copiada al portapapeles.');
    } catch {
      this.notifications.showError('No se pudo copiar la URL. Cópiala manualmente.');
    }
  }

  revokeInvitation(id: string): void {
    const companyId = this.tenantId();
    if (!companyId) return;
    this.vendors.revokeInvitation({ companyId, invitationId: id });
  }

  refresh(): void {
    const companyId = this.tenantId();
    if (!companyId) return;
    this.portal.loadStores();
    this.vendors.load(companyId);
  }

  invalid(field: string): boolean {
    const control = this.invitationForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
