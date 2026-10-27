import { DatePipe, NgClass } from '@angular/common';
import { Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { InvitationStatusPipe } from '../../../../shared/pipes/invitation-status.pipe';
import { injectSeoPage } from '../../../../core/services/seo/seo.service';
import { NotificationService } from '../../../../core/services/notification/notification.service';
import { SkeletonLoaderComponent } from '../../../../shared/ui/skeleton/skeleton-loader.component';
import { AuthStore } from '../../../auth/public-api';
import { CompanyStore } from '../../state/company/company.store';
import { CompanyPortalStore } from '../../state/company-portal/company-portal.store';
import { CompanyInvitationsStore } from '../../state/company-invitations/company-invitations.store';

/** Dominios frecuentes; el empresario puede cambiarlo o escribir uno propio. */
const EMAIL_DOMAINS = ['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'icloud.com'];

const LOCAL_PART = /^[a-zA-Z0-9._%+-]+$/;
const DOMAIN_PART = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/** Gestión de vendedores e invitaciones del empresario. */
@Component({
  selector: 'app-company-vendors',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    DatePipe,
    NgClass,
    InvitationStatusPipe,
    SkeletonLoaderComponent,
  ],
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

  readonly emailDomains = EMAIL_DOMAINS;
  readonly customDomain = 'otro';

  /**
   * Valida el correo compuesto: parte local + dominio. El dominio puede venir
   * del selector o del campo libre cuando se elige "Otro".
   */
  private readonly emailGroupValidator = (group: AbstractControl): ValidationErrors | null => {
    const local = String(group.get('emailLocal')?.value ?? '').trim();
    if (!local) return { emailLocal: 'required' };
    if (!LOCAL_PART.test(local)) return { emailLocal: 'pattern' };

    const selected = String(group.get('emailDomain')?.value ?? '');
    const custom = String(group.get('emailDomainCustom')?.value ?? '')
      .trim()
      .replace(/^@+/, '');
    const domain = selected === this.customDomain ? custom : selected;

    if (!domain) return { emailDomain: 'required' };
    if (!DOMAIN_PART.test(domain)) return { emailDomain: 'pattern' };
    return null;
  };

  readonly invitationForm = this.fb.nonNullable.group(
    {
      emailLocal: ['', [Validators.required, Validators.pattern(LOCAL_PART)]],
      emailDomain: ['gmail.com', Validators.required],
      emailDomainCustom: [''],
      storeId: ['', Validators.required],
      participationPercentage: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
    },
    { validators: [this.emailGroupValidator] },
  );

  private readonly formValue = toSignal(this.invitationForm.valueChanges, {
    initialValue: this.invitationForm.getRawValue(),
  });

  /** Correo completo que se enviará al backend. */
  readonly emailPreview = computed(() => {
    const { emailLocal, emailDomain, emailDomainCustom } = this.formValue();
    const local = (emailLocal ?? '').trim();
    const domain = ((emailDomain === this.customDomain ? emailDomainCustom : emailDomain) ?? '')
      .trim()
      .replace(/^@+/, '');
    return local && domain ? `${local}@${domain}` : '';
  });

  readonly emailError = computed(() => {
    const { emailLocal, emailDomain, emailDomainCustom } = this.formValue();
    const local = (emailLocal ?? '').trim();
    if (!local) return 'Escribe la parte antes de @.';
    if (!LOCAL_PART.test(local)) {
      return 'Usa solo letras, números, punto, guion o guion bajo.';
    }

    const domain = ((emailDomain === this.customDomain ? emailDomainCustom : emailDomain) ?? '')
      .trim()
      .replace(/^@+/, '');
    if (!domain) return 'Escribe el dominio del correo.';
    if (!DOMAIN_PART.test(domain)) return 'Escribe un dominio válido, por ejemplo gmail.com.';
    return null;
  });

  readonly companyName = computed(
    () => this.companyStore.company()?.name?.trim() || 'Nuestra empresa',
  );

  readonly shareMessage = computed(() => {
    const invitation = this.vendors.lastInvitation();
    if (!invitation) return '';

    return [
      '¡Hola! 👋',
      '',
      `*${this.companyName()}* te invita a administrar la tienda *${invitation.storeName}*.`,
      '',
      `📊 Participación: *${invitation.participationPercentage} %*`,
      `⏳ Invitación válida hasta: *${this.formatExpiry(invitation.expiresAt)}*`,
      '',
      'Crea tu cuenta aquí:',
      invitation.invitationUrl,
      '',
      '¡Te esperamos! 🚀',
    ].join('\n');
  });

  readonly whatsappShareUrl = computed(() => {
    const message = this.shareMessage();
    return message ? `https://wa.me/?text=${encodeURIComponent(message)}` : '';
  });

  readonly mailtoShareUrl = computed(() => {
    const invitation = this.vendors.lastInvitation();
    if (!invitation) return '';
    const subject = `Invitación para administrar ${invitation.storeName}`;
    return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(this.shareMessage())}`;
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

  /** Deja el formulario listo para invitar a la siguiente persona. */
  private readonly resetAfterCreate = effect(() => {
    const invitation = this.vendors.lastInvitation();
    if (!invitation) return;
    this.invitationForm.patchValue({
      emailLocal: '',
      emailDomain: 'gmail.com',
      emailDomainCustom: '',
      storeId: '',
      participationPercentage: 0,
    });
    this.invitationForm.markAsPristine();
    this.invitationForm.markAsUntouched();
  });

  get isCustomDomain(): boolean {
    return this.invitationForm.controls.emailDomain.value === this.customDomain;
  }

  /** Si pegan `ana@outlook.com`, se separa en parte local y dominio. */
  onEmailLocalInput(): void {
    const control = this.invitationForm.controls.emailLocal;
    const value = control.value;
    const at = value.indexOf('@');
    if (at <= 0) return;

    const local = value.slice(0, at).trim();
    const domain = value
      .slice(at + 1)
      .trim()
      .replace(/^@+/, '');
    control.setValue(local, { emitEvent: false });
    if (!domain) return;

    const known = this.emailDomains.includes(domain.toLowerCase());
    this.invitationForm.patchValue({
      emailDomain: known ? domain.toLowerCase() : this.customDomain,
      emailDomainCustom: known ? '' : domain,
    });
  }

  showEmailError(): boolean {
    const local = this.invitationForm.controls.emailLocal;
    const custom = this.invitationForm.controls.emailDomainCustom;
    const touched = local.dirty || local.touched || custom.dirty || custom.touched;
    return touched && !!this.emailError();
  }

  submitInvitation(): void {
    const email = this.composeEmail();
    if (this.invitationForm.invalid || this.vendors.saving() || !email) {
      this.invitationForm.markAllAsTouched();
      return;
    }

    const companyId = this.tenantId();
    if (!companyId) return;

    const { storeId, participationPercentage } = this.invitationForm.getRawValue();
    this.vendors.createInvitation({
      companyId,
      data: {
        email,
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

  async copyMessage(): Promise<void> {
    const message = this.shareMessage();
    if (!message) return;

    try {
      await navigator.clipboard.writeText(message);
      this.notifications.showSuccess('Mensaje de invitación copiado.');
    } catch {
      this.notifications.showError('No se pudo copiar el mensaje. Cópialo manualmente.');
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

  private composeEmail(): string {
    const { emailLocal, emailDomain, emailDomainCustom } = this.invitationForm.getRawValue();
    const domain = (emailDomain === this.customDomain ? emailDomainCustom : emailDomain)
      .trim()
      .replace(/^@+/, '');
    return `${emailLocal.trim()}@${domain}`.toLowerCase();
  }

  private formatExpiry(raw: string): string {
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return 'la fecha indicada';
    return new Intl.DateTimeFormat('es-NI', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  }
}
