import { Component, HostListener, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LogisticaSidebarComponent } from '../../components/logistica-sidebar/logistica-sidebar.component';

/**
 * Shell del módulo de logística (ADR-25): sidebar del diseño + `<router-outlet>`.
 * Mantiene el estado del drawer móvil (`R-UX-2`) y se cierra con Escape
 * (`R-AC-3`) además del backdrop y de elegir un ítem de navegación.
 */
@Component({
  selector: 'app-logistica-shell',
  standalone: true,
  imports: [RouterOutlet, LogisticaSidebarComponent],
  templateUrl: './logistica-shell.component.html',
})
export default class LogisticaShellComponent {
  readonly isSidebarOpen = signal(false);

  @HostListener('document:keydown.escape')
  closeSidebar(): void {
    this.isSidebarOpen.set(false);
  }
}
