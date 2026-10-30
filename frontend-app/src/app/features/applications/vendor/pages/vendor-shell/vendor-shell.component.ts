import { Component, DestroyRef, HostListener, effect, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
  AuthStore,
  canEnterWorkspace,
  hasPermission,
  type Permission,
  type Workspace,
} from '../../../auth/public-api';
import { BrandingService } from '../../../../../core/services/branding/branding.service';
import { workspaceModuleGroups } from '../../../../../core/workspace/constants/workspace-modules.constants';
import { WorkspaceSidebarComponent } from '../../../../../shared/ui/workspace-sidebar/workspace-sidebar.component';
import { storagePublicObjectUrl } from '../../../storage/public-api';
import { VendorStoreStore } from '../../state/vendor-store/vendor-store.store';

/**
 * Shell del panel del vendedor (ADR-20): sidebar del diseño + `<router-outlet>`.
 * Mantiene el estado del drawer móvil (`R-UX-2`) y se cierra con Escape
 * (`R-AC-3`) además del backdrop y de elegir un ítem de navegación.
 */
@Component({
  selector: 'app-vendor-shell',
  standalone: true,
  imports: [RouterOutlet, WorkspaceSidebarComponent],
  templateUrl: './vendor-shell.component.html',
})
export default class VendorShellComponent {
  readonly isSidebarOpen = signal(false);
  private readonly auth = inject(AuthStore);
  private readonly vendorStore = inject(VendorStoreStore);
  private readonly branding = inject(BrandingService);
  private readonly cleanup = inject(DestroyRef).onDestroy(() => this.branding.reset());
  readonly navGroups = workspaceModuleGroups('store', (module) => {
    const user = this.auth.user();
    return (
      canEnterWorkspace(user, module.workspace as Workspace) &&
      (!module.permission || hasPermission(user, module.permission as Permission))
    );
  });

  /** Carga la tienda del vendedor para reflejar su logo en la pestaña. */
  private readonly loadStore = this.vendorStore.load();

  /** La pestaña usa el logo de la tienda; si no hay, el icono por defecto. */
  private readonly syncBranding = effect(() => {
    const store = this.vendorStore.store();
    const logo =
      store?.logoUrl ??
      store?.companyLogoUrl ??
      (store?.logoObjectId ? storagePublicObjectUrl(store.logoObjectId) : null);
    this.branding.setLogo(logo);
  });

  @HostListener('document:keydown.escape')
  closeSidebar(): void {
    this.isSidebarOpen.set(false);
  }
}
