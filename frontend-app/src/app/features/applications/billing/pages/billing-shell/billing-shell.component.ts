import { Component, inject, signal } from '@angular/core';
import {
  AuthStore,
  canEnterWorkspace,
  hasPermission,
  type Permission,
  type Workspace,
} from '../../../auth/public-api';
import { workspaceModuleGroups } from '../../../../../core/workspace/constants/workspace-modules.constants';
import { WorkspaceShellComponent } from '../../../../../shared/ui/workspace-shell/workspace-shell.component';

/**
 * Shell del módulo de facturación (ADR-23). Es un submódulo del workspace de
 * tienda: comparte chrome y navegación del registro, limitada a la sección
 * `billing`. En impresión se oculta el chrome.
 */
@Component({
  selector: 'app-billing-shell',
  standalone: true,
  imports: [WorkspaceShellComponent],
  templateUrl: './billing-shell.component.html',
})
export default class BillingShellComponent {
  readonly isSidebarOpen = signal(false);
  private readonly auth = inject(AuthStore);

  readonly navGroups = workspaceModuleGroups(
    'store',
    (module) => {
      const user = this.auth.user();
      return (
        canEnterWorkspace(user, module.workspace as Workspace) &&
        (!module.permission || hasPermission(user, module.permission as Permission))
      );
    },
    ['billing'],
  );
}
