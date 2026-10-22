import { Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import type { CompanyNavItem } from './company-sidebar.types';

/** Navegación del workspace consolidado del propietario de empresa. */
@Component({
  selector: 'app-company-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './company-sidebar.component.html',
})
export class CompanySidebarComponent {
  readonly open = input(false);
  readonly closed = output<void>();
  readonly itemSelected = output<void>();

  readonly mainItems: readonly CompanyNavItem[] = [
    {
      label: 'Dashboard',
      icon: 'fa-solid fa-grid-2',
      link: '/empresa/inicio',
      testId: 'company-nav-inicio',
    },
    {
      label: 'Ventas',
      icon: 'fa-solid fa-cart-shopping',
      link: '/empresa/ventas',
      testId: 'company-nav-ventas',
    },
    {
      label: 'Clientes',
      icon: 'fa-solid fa-user-group',
      link: '/empresa/clientes',
      testId: 'company-nav-clientes',
    },
    {
      label: 'Productos / Servicios',
      icon: 'fa-solid fa-cube',
      link: '/empresa/productos',
      testId: 'company-nav-productos',
    },
    {
      label: 'Compras',
      icon: 'fa-solid fa-bag-shopping',
      link: '/empresa/compras',
      testId: 'company-nav-compras',
    },
    {
      label: 'Gastos',
      icon: 'fa-solid fa-dollar-sign',
      link: '/empresa/gastos',
      testId: 'company-nav-gastos',
    },
    {
      label: 'Caja / Pagos',
      icon: 'fa-solid fa-wallet',
      link: '/empresa/caja',
      testId: 'company-nav-caja',
    },
    {
      label: 'Cuentas por pagar',
      icon: 'fa-solid fa-file-invoice-dollar',
      link: '/empresa/cuentas-por-pagar',
      testId: 'company-nav-cuentas',
    },
    {
      label: 'Salarios',
      icon: 'fa-solid fa-users',
      link: '/empresa/salarios',
      testId: 'company-nav-salarios',
    },
    {
      label: 'Proformas',
      icon: 'fa-solid fa-file-lines',
      link: '/empresa/proformas',
      testId: 'company-nav-proformas',
    },
    {
      label: 'Códigos de barras',
      icon: 'fa-solid fa-barcode',
      link: '/empresa/codigos-de-barras',
      testId: 'company-nav-barcodes',
    },
    {
      label: 'Créditos',
      icon: 'fa-solid fa-credit-card',
      link: '/empresa/creditos',
      testId: 'company-nav-creditos',
    },
    {
      label: 'Impuestos',
      icon: 'fa-solid fa-file-invoice',
      link: '/empresa/impuestos',
      testId: 'company-nav-impuestos',
    },
    {
      label: 'Reportes',
      icon: 'fa-solid fa-chart-column',
      link: '/empresa/reportes',
      testId: 'company-nav-reportes',
    },
    {
      label: 'Estadísticas',
      icon: 'fa-solid fa-wave-square',
      link: '/empresa/estadisticas',
      testId: 'company-nav-estadisticas',
    },
    {
      label: 'Notificaciones',
      icon: 'fa-solid fa-bell',
      link: '/empresa/notificaciones',
      testId: 'company-nav-notificaciones',
    },
  ];

  readonly managementItems: readonly CompanyNavItem[] = [
    {
      label: 'Tiendas',
      icon: 'fa-solid fa-store',
      link: '/empresa/tiendas',
      testId: 'company-nav-tiendas',
    },
    {
      label: 'Vendedores',
      icon: 'fa-solid fa-user-tie',
      link: '/empresa/vendedores',
      testId: 'company-nav-vendedores',
    },
    {
      label: 'Logística',
      icon: 'fa-solid fa-truck-fast',
      link: '/empresa/logistica',
      testId: 'company-nav-logistica',
    },
  ];

  readonly footerItems: readonly CompanyNavItem[] = [
    {
      label: 'Configuración',
      icon: 'fa-solid fa-gear',
      link: '/empresa/configuracion',
      testId: 'company-nav-configuracion',
    },
    {
      label: 'Ayuda y soporte',
      icon: 'fa-solid fa-circle-question',
      link: '/empresa/ayuda',
      testId: 'company-nav-ayuda',
    },
  ];
}
