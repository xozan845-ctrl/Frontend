import { Component, HostListener, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BillingSidebarComponent } from '../../components/billing-sidebar/billing-sidebar.component';

/**
 * Shell del módulo de facturación (ADR-23): sidebar del diseño + router-outlet.
 * Mantiene el estado del drawer móvil (`R-UX-2`) y se cierra con Escape
 * (`R-AC-3`). En impresión oculta el chrome para dejar solo el comprobante.
 */
@Component({
  selector: 'app-billing-shell',
  standalone: true,
  imports: [RouterOutlet, BillingSidebarComponent],
  templateUrl: './billing-shell.component.html',
})
export default class BillingShellComponent {
  readonly isSidebarOpen = signal(false);

  @HostListener('document:keydown.escape')
  closeSidebar(): void {
    this.isSidebarOpen.set(false);
  }
}
