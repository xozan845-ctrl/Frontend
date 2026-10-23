import type { ApiConfiguration } from '../models/api-config.model';

export type { ApiConfiguration, ApiEndpointsConfig } from '../models/api-config.model';

export const DEFAULT_API_CONFIG: ApiConfiguration = {
  dataSource: 'api',
  authType: 'bearer',
  withCredentials: false,
  endpoints: {
    products: '/catalog/productos',
    categories: '/catalog/productos',
    storefront: '/tiendas',
    auth: '/auth',
    orders: '/orders',
    cart: '/carrito',
    vendor: '/vendedores',
    companies: '/empresas',
    inventory: '/admin/inventario',
    shipments: '/envios',
    adminShipments: '/admin/envios',
    companyShipments: '/empresarios/me/envios',
  },
};
