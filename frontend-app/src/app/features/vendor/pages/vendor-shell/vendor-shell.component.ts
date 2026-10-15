import { Component, HostListener, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { VendorSidebarComponent } from '../../components/vendor-sidebar/vendor-sidebar.component';

/**
 * Shell del panel del vendedor (ADR-20): sidebar del diseño + `<router-outlet>`.
 * Mantiene el estado del drawer móvil (`R-UX-2`) y se cierra con Escape
 * (`R-AC-3`) además del backdrop y de elegir un ítem de navegación.
 */
@Component({
  selector: 'app-vendor-shell',
  standalone: true,
  imports: [RouterOutlet, VendorSidebarComponent],
  templateUrl: './vendor-shell.component.html',
})
export default class VendorShellComponent {
  readonly isSidebarOpen = signal(false);

  @HostListener('document:keydown.escape')
  closeSidebar(): void {
    this.isSidebarOpen.set(false);
  }
}
