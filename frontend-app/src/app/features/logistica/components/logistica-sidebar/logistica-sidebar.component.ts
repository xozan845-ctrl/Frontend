import { Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import type { LogisticaNavItem } from './logistica-sidebar.types';

/**
 * Navegación del módulo de logística (presentacional, `R-SO-8`): replica el
 * sidebar oscuro del boceto y marca la sección activa con `aria-current`
 * (`R-AC-1`, `R-AC-2`). En móvil llega como drawer y avisa al shell al cerrarse.
 */
@Component({
  selector: 'app-logistica-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './logistica-sidebar.component.html',
})
export class LogisticaSidebarComponent {
  readonly open = input(false);
  readonly closed = output<void>();
  readonly itemSelected = output<void>();

  readonly mainItems: readonly LogisticaNavItem[] = [
    {
      label: 'Dashboard',
      icon: 'fa-solid fa-house',
      link: '/logistica/dashboard',
      testId: 'logistica-nav-dashboard',
    },
    {
      label: 'Mapa de clientes',
      icon: 'fa-solid fa-map',
      link: '/logistica/mapa-clientes',
      testId: 'logistica-nav-mapa-clientes',
    },
    {
      label: 'Rutas',
      icon: 'fa-solid fa-route',
      link: '/logistica/rutas',
      testId: 'logistica-nav-rutas',
    },
    {
      label: 'Pedidos en ruta',
      icon: 'fa-solid fa-box',
      link: '/logistica/pedidos',
      testId: 'logistica-nav-pedidos',
    },
    {
      label: 'Repartidores',
      icon: 'fa-solid fa-user',
      link: '/logistica/repartidores',
      testId: 'logistica-nav-repartidores',
    },
    {
      label: 'Zonas',
      icon: 'fa-solid fa-location-dot',
      link: '/logistica/zonas',
      testId: 'logistica-nav-zonas',
    },
    {
      label: 'Incidencias',
      icon: 'fa-solid fa-triangle-exclamation',
      link: '/logistica/incidencias',
      testId: 'logistica-nav-incidencias',
    },
    {
      label: 'Reportes',
      icon: 'fa-solid fa-chart-column',
      link: '/logistica/reportes',
      testId: 'logistica-nav-reportes',
    },
  ];

  readonly footerItems: readonly LogisticaNavItem[] = [
    {
      label: 'Configuración',
      icon: 'fa-solid fa-gear',
      link: '/logistica/configuracion',
      testId: 'logistica-nav-configuracion',
    },
  ];
}
