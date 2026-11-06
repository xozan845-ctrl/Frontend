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
 * (`/app/logistica`, `/app/empresa/logistica` o `/app/tienda/logistica`).
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
    if (url.startsWith('/app/empresa/logistica')) return '/app/empresa/logistica';
    if (url.startsWith('/app/tienda/logistica')) return '/app/tienda/logistica';
    if (url.startsWith('/app/logistica')) return '/app/logistica';
    return '/app/logistica';
  });
  readonly contextLabel = computed(() => {
    if (this.basePath() === '/app/empresa/logistica') return 'Logística · Empresa';
    if (this.basePath() === '/app/tienda/logistica') return 'Logística · Tienda';
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
