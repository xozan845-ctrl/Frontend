import { Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface BillingNavItem {
  label: string;
  icon: string;
  link: string;
  testId: string;
}

interface BillingSoonItem {
  label: string;
  icon: string;
}

/**
 * Navegación del módulo de facturación (presentacional, `R-SO-8`): replica el
 * sidebar oscuro del panel del vendedor y marca la sección activa con
 * `aria-current` (`R-AC-1`, `R-AC-2`). Las secciones sin fase se muestran como
 * "Pronto" en lugar de enlaces muertos (`R-UX-1`).
 */
@Component({
  selector: 'app-billing-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './billing-sidebar.component.html',
})
export class BillingSidebarComponent {
  readonly open = input(false);
  readonly closed = output<void>();
  readonly itemSelected = output<void>();

  readonly mainItems: readonly BillingNavItem[] = [
    {
      label: 'Nueva factura',
      icon: 'fa-solid fa-file-invoice-dollar',
      link: '/facturacion/nueva',
      testId: 'billing-nav-nueva',
    },
    {
      label: 'Facturas',
      icon: 'fa-solid fa-file-invoice',
      link: '/facturacion/facturas',
      testId: 'billing-nav-facturas',
    },
  ];

  readonly soonItems: readonly BillingSoonItem[] = [
    { label: 'Cotizaciones', icon: 'fa-solid fa-file-lines' },
    { label: 'Clientes', icon: 'fa-solid fa-user-group' },
    { label: 'Reportes', icon: 'fa-solid fa-chart-line' },
  ];

  readonly footerItems: readonly BillingNavItem[] = [
    {
      label: 'Panel del vendedor',
      icon: 'fa-solid fa-store',
      link: '/vendedor/inicio',
      testId: 'billing-nav-vendedor',
    },
  ];
}
