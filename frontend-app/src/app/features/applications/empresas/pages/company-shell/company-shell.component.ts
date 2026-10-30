import { Component, HostListener, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
  AuthStore,
  canEnterWorkspace,
  hasPermission,
  type Permission,
  type Workspace,
} from '../../../auth/public-api';
import { workspaceModuleGroups } from '../../../../../core/workspace/constants/workspace-modules.constants';
import { WorkspaceSidebarComponent } from '../../../../../shared/ui/workspace-sidebar/workspace-sidebar.component';
import { COMPANY_WORKSPACE_PROVIDERS } from '../../state/company/company.store';

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
  readonly navGroups = workspaceModuleGroups('company', (module) => {
    const user = this.auth.user();
    return (
      canEnterWorkspace(user, module.workspace as Workspace) &&
      (!module.permission || hasPermission(user, module.permission as Permission))
    );
  });

  @HostListener('document:keydown.escape')
  closeSidebar(): void {
    this.isSidebarOpen.set(false);
  }
}
