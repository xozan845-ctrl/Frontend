import { Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import type {
  WorkspaceModuleGroup,
  WorkspaceModuleSection,
} from '../../../../core/workspace/models/workspace-module.model';

/**
 * Navegación del panel del vendedor (presentacional, `R-SO-8`): pinta los
 * módulos que el shell calcula según sesión y permisos.
 */
@Component({
  selector: 'app-vendor-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './vendor-sidebar.component.html',
})
export class VendorSidebarComponent {
  readonly open = input(false);
  readonly groups = input<readonly WorkspaceModuleGroup[]>([]);
  readonly closed = output<void>();
  readonly itemSelected = output<void>();

  groupClass(section: WorkspaceModuleSection): string {
    if (section === 'footer') return 'mt-auto border-t border-white/10 pt-4';
    return '';
  }
}
