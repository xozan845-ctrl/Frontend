import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
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
 * Shell del módulo de logística (ADR-25). Comparte el chrome con el resto de
 * workspaces y resuelve la navegación del registro según el contexto de la URL
 * (`/logistica`, `/empresa/logistica` o `/vendedor/logistica`).
 */
@Component({
  selector: 'app-logistica-shell',
  standalone: true,
  imports: [WorkspaceShellComponent],
  templateUrl: './logistica-shell.component.html',
})
export default class LogisticaShellComponent {
  private readonly router = inject(Router);
  private readonly authStore = inject(AuthStore);
  readonly isSidebarOpen = signal(false);
  readonly basePath = computed(() => {
    const url = this.router.url;
    if (url.startsWith('/empresa/logistica')) return '/empresa/logistica';
    if (url.startsWith('/vendedor/logistica')) return '/vendedor/logistica';
    return '/logistica';
  });
  readonly contextLabel = computed(() => {
    if (this.basePath() === '/empresa/logistica') return 'Logística · Empresa';
    if (this.basePath() === '/vendedor/logistica') return 'Logística · Tienda';
    if (this.authStore.user()?.logisticsCompanyId) return 'Empresa logística';
    return 'Logística';
  });

  readonly navGroups = workspaceModuleGroups('logistics', (module) => {
    const user = this.authStore.user();
    return (
      canEnterWorkspace(user, module.workspace as Workspace) &&
      (!module.permission || hasPermission(user, module.permission as Permission))
    );
  }).map((group) => ({
    ...group,
    items: group.items.map((item) => ({
      ...item,
      link: `${this.basePath()}/${item.path ?? ''}`.replace(/\/+$/, ''),
    })),
  }));
}
