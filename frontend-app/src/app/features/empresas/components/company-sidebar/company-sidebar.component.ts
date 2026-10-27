import { Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import type {
  WorkspaceModuleGroup,
  WorkspaceModuleSection,
} from '../../../../core/workspace/models/workspace-module.model';

/** Navegación del workspace consolidado del propietario de empresa. */
@Component({
  selector: 'app-company-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './company-sidebar.component.html',
})
export class CompanySidebarComponent {
  readonly open = input(false);
  readonly groups = input<readonly WorkspaceModuleGroup[]>([]);
  readonly closed = output<void>();
  readonly itemSelected = output<void>();

  groupClass(section: WorkspaceModuleSection): string {
    if (section === 'footer') return 'mt-auto border-t border-white/10 pt-4';
    if (section === 'administracion') return 'pt-6';
    return '';
  }
}
