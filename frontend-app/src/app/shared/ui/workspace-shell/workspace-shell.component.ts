import { Component, HostListener, input, output } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import type { WorkspaceModuleGroup } from '../../../core/workspace/models/workspace-module.model';
import { WorkspaceSidebarComponent } from '../workspace-sidebar/workspace-sidebar.component';

/**
 * Chrome compartido de los workspaces (`R-AR-16`).
 *
 * Es presentacional: recibe la navegación ya filtrada por contexto/permisos y
 * el estado del drawer. El shell de cada feature conserva su branding, stores y
 * reglas de negocio; así company/store/admin/logistics comparten la misma
 * estructura visual sin acoplarse entre features.
 */
@Component({
  selector: 'app-workspace-shell',
  standalone: true,
  imports: [RouterOutlet, WorkspaceSidebarComponent],
  templateUrl: './workspace-shell.component.html',
})
export class WorkspaceShellComponent {
  readonly groups = input.required<readonly WorkspaceModuleGroup[]>();
  readonly sidebarLabel = input.required<string>();
  readonly eyebrow = input('');
  readonly title = input('');
  readonly wide = input(false);
  readonly labelTopPadding = input(false);
  readonly contextLabel = input('');
  readonly sidebarId = input('workspace-sidebar');
  readonly toggleTestId = input('workspace-sidebar-toggle');
  readonly open = input(false);

  readonly openChange = output<boolean>();
  readonly itemSelected = output<void>();

  @HostListener('document:keydown.escape')
  closeSidebar(): void {
    this.openChange.emit(false);
  }

  onItemSelected(): void {
    this.itemSelected.emit();
    this.openChange.emit(false);
  }
}
