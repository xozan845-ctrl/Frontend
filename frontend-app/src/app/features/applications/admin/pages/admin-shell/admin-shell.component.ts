import { Component, inject, signal } from '@angular/core';
import {
  AuthStore,
  canEnterWorkspace,
  hasPermission,
  type Permission,
  type Workspace,
} from '../../../auth/public-api';
import { workspaceModuleGroups } from '@core/workspace/constants/workspace-modules.constants';
import { WorkspaceShellComponent } from '@shared/ui/workspace-shell/workspace-shell.component';

/** Shell del workspace de plataforma (admin/super_admin). */
@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [WorkspaceShellComponent],
  templateUrl: './admin-shell.component.html',
})
export default class AdminShellComponent {
  readonly isSidebarOpen = signal(false);
  private readonly auth = inject(AuthStore);

  readonly navGroups = workspaceModuleGroups('platform', (module) => {
    const user = this.auth.user();
    return (
      canEnterWorkspace(user, module.workspace as Workspace) &&
      (!module.permission || hasPermission(user, module.permission as Permission))
    );
  });
}
