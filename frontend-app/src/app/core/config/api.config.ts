import type { ApiConfiguration } from '../models/api-config.model';

export type { ApiConfiguration, ApiEndpointsConfig } from '../models/api-config.model';

export const DEFAULT_API_CONFIG: ApiConfiguration = {
  dataSource: 'api',
  authType: 'bearer',
  withCredentials: false,
  endpoints: {
    products: '/catalog/productos',
    companyServices: '/catalog/servicios',
    catalogInventorySettings: '/catalog/configuracion-inventario',
    catalogImport: '/catalog/productos/importar',
    catalogScan: '/catalog/escanear',
    catalogCombos: '/catalog/combos',
    catalogPromotions: '/catalog/promociones',
    catalogMovements: '/catalog/inventario/movimientos',
    storefront: '/tiendas',
    auth: '/auth',
    orders: '/orders',
    cart: '/carrito',
    vendor: '/vendedores',
    companies: '/empresas',
    logisticsCompanies: '/logistics/companies',
    inventory: '/admin/inventario',
    shipments: '/envios',
    adminShipments: '/admin/envios',
    companyShipments: '/empresarios/me/envios',
    adminStorage: '/admin/storage',
    field: '/field',
    storage: '/storage',
    companyStores: '/empresarios/me/tiendas',
    companySales: '/empresarios/me/ventas',
  },
};
