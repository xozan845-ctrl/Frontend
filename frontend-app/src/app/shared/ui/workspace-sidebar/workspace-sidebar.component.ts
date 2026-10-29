import { Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import type {
  WorkspaceModuleGroup,
  WorkspaceModuleSection,
} from '../../../core/workspace/models/workspace-module.model';

/**
 * Sidebar presentacional compartido por los workspaces. Los shells aportan los
 * grupos ya filtrados por sesión/permisos; aquí solo se pinta la navegación
 * (`R-SO-8`) y se mantiene el drawer móvil accesible (`R-AC-1/2/3`).
 */
@Component({
  selector: 'app-workspace-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './workspace-sidebar.component.html',
})
export class WorkspaceSidebarComponent {
  readonly open = input(false);
  readonly groups = input<readonly WorkspaceModuleGroup[]>([]);
  readonly sidebarLabel = input.required<string>();
  readonly eyebrow = input('');
  readonly title = input('');
  readonly wide = input(false);
  readonly labelTopPadding = input(false);
  readonly closed = output<void>();
  readonly itemSelected = output<void>();

  groupClass(section: WorkspaceModuleSection): string {
    if (section === 'footer') return 'mt-auto border-t border-white/10 pt-4';
    if (section === 'administracion') return 'pt-6';
    return '';
  }
}
