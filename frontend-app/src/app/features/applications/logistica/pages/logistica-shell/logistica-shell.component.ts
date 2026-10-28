import { Component, computed, HostListener, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthStore } from '../../../auth/public-api';
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

  @HostListener('document:keydown.escape')
  closeSidebar(): void {
    this.isSidebarOpen.set(false);
  }
}
