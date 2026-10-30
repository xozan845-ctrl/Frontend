import { Component, DestroyRef, HostListener, effect, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
  AuthStore,
  canEnterWorkspace,
  hasPermission,
  type Permission,
  type Workspace,
} from '../../../auth/public-api';
import { workspaceModuleGroups } from '../../../../../core/workspace/constants/workspace-modules.constants';
import { BrandingService } from '../../../../../core/services/branding/branding.service';
import { WorkspaceSidebarComponent } from '../../../../../shared/ui/workspace-sidebar/workspace-sidebar.component';
import { storagePublicObjectUrl } from '../../../storage/public-api';
import { COMPANY_WORKSPACE_PROVIDERS, CompanyStore } from '../../state/company/company.store';

/** Shell aislado del workspace del propietario de empresa. */
@Component({
  selector: 'app-company-shell',
  standalone: true,
  imports: [RouterOutlet, WorkspaceSidebarComponent],
  providers: COMPANY_WORKSPACE_PROVIDERS,
  templateUrl: './company-shell.component.html',
})
export default class CompanyShellComponent {
  readonly isSidebarOpen = signal(false);
  private readonly auth = inject(AuthStore);
  private readonly companyStore = inject(CompanyStore);
  private readonly branding = inject(BrandingService);
  private readonly cleanup = inject(DestroyRef).onDestroy(() => this.branding.reset());
  readonly navGroups = workspaceModuleGroups('company', (module) => {
    const user = this.auth.user();
    return (
      canEnterWorkspace(user, module.workspace as Workspace) &&
      (!module.permission || hasPermission(user, module.permission as Permission))
    );
  });

  /** Carga la empresa activa para reflejar su logo en la pestaña. */
  private readonly loadCompany = effect(() => {
    const id = this.auth.user()?.tenantId;
    if (id && this.companyStore.company()?.id !== id) {
      this.companyStore.load(id);
    }
  });

  /** La pestaña usa el logo de la empresa; si no hay, el icono por defecto. */
  private readonly syncBranding = effect(() => {
    const company = this.companyStore.company();
    const logo =
      company?.logoUrl ??
      (company?.logoObjectId ? storagePublicObjectUrl(company.logoObjectId) : null);
    this.branding.setLogo(logo);
  });

  @HostListener('document:keydown.escape')
  closeSidebar(): void {
    this.isSidebarOpen.set(false);
  }
}
