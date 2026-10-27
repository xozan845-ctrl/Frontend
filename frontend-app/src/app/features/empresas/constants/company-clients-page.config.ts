import type {
  ClientsPageConfig,
  ClientsScopeConfig,
} from '../../../shared/clients/models/clients-config.model';

/** Configuración de la página de clientes en el workspace de empresa. */
export const COMPANY_CLIENTS_PAGE_CONFIG: ClientsPageConfig = {
  title: 'Clientes',
  subtitle: 'CRM de tu negocio. Centraliza, analiza y administra cada relación con tus clientes.',
  homeLabel: 'Inicio',
  homeLink: '/empresa/inicio',
  importEnabled: true,
};

/** Ámbito de datos de la cartera en el workspace de empresa. */
export const COMPANY_CLIENTS_SCOPE_CONFIG: ClientsScopeConfig = {
  scope: 'company',
  ordersPath: '/empresa',
};
