import { Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import type { VendorNavItem } from './vendor-sidebar.types';

/**
 * Navegación del panel del vendedor (presentacional, `R-SO-8`): pinta las
 * secciones del diseño de la tienda y marca la activa con `aria-current`
 * (`R-AC-1`, `R-AC-2`). En móvil llega como drawer: `open` lo muestra y
 * `closed` avisa al shell para cerrarlo (backdrop o Escape).
 */
@Component({
  selector: 'app-vendor-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './vendor-sidebar.component.html',
})
export class VendorSidebarComponent {
  readonly open = input(false);
  readonly closed = output<void>();
  readonly itemSelected = output<void>();

  readonly mainItems: readonly VendorNavItem[] = [
    {
      label: 'Inicio',
      icon: 'fa-solid fa-house',
      link: '/vendedor/inicio',
      testId: 'vendor-nav-inicio',
    },
    {
      label: 'Productos',
      icon: 'fa-solid fa-box',
      link: '/vendedor/productos',
      testId: 'vendor-nav-productos',
    },
    {
      label: 'Clientes',
      icon: 'fa-solid fa-user-group',
      link: '/vendedor/clientes',
      testId: 'vendor-nav-clientes',
    },
    {
      label: 'Ventas',
      icon: 'fa-solid fa-cart-shopping',
      link: '/vendedor/ventas/nuevo',
      testId: 'vendor-nav-ventas',
    },
    {
      label: 'Pedidos',
      icon: 'fa-solid fa-receipt',
      link: '/vendedor/pedidos',
      testId: 'vendor-nav-pedidos',
    },
    {
      label: 'Mi empresa',
      icon: 'fa-solid fa-building',
      link: '/vendedor/empresa',
      testId: 'vendor-nav-empresa',
    },
    {
      label: 'Facturación',
      icon: 'fa-solid fa-file-invoice-dollar',
      link: '/facturacion/nueva',
      testId: 'vendor-nav-facturacion',
    },
    {
      label: 'Inventario',
      icon: 'fa-solid fa-warehouse',
      link: '/vendedor/inventario',
      testId: 'vendor-nav-inventario',
    },
    {
      label: 'Reportes',
      icon: 'fa-solid fa-chart-line',
      link: '/vendedor/reportes',
      testId: 'vendor-nav-reportes',
    },
  ];

  readonly footerItems: readonly VendorNavItem[] = [
    {
      label: 'Ajustes',
      icon: 'fa-solid fa-gear',
      link: '/vendedor/ajustes',
      testId: 'vendor-nav-ajustes',
    },
    {
      label: 'Ayuda y soporte',
      icon: 'fa-solid fa-circle-question',
      link: '/vendedor/ayuda',
      testId: 'vendor-nav-ayuda',
    },
  ];
}
