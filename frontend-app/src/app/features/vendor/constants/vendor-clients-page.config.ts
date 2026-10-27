import type {
  ClientsPageConfig,
  ClientsScopeConfig,
} from '../../../shared/clients/models/clients-config.model';

/** Configuración de la página de clientes en el panel del vendedor. */
export const VENDOR_CLIENTS_PAGE_CONFIG: ClientsPageConfig = {
  title: 'Clientes',
  subtitle: 'CRM de tu cartera. Consulta, analiza y administra los clientes de tus ventas.',
  homeLabel: 'Inicio',
  homeLink: '/vendedor/inicio',
  importEnabled: true,
};

/** Ámbito de datos de la cartera en el panel del vendedor. */
export const VENDOR_CLIENTS_SCOPE_CONFIG: ClientsScopeConfig = {
  scope: 'vendor',
  ordersPath: '/vendedor/mis-ventas',
};
