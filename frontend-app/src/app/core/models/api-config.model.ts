/** Contrato de configuración del API (tipos puros). */
export interface ApiEndpointsConfig {
  products: string;
  storefront: string;
  auth: string;
  orders: string;
  cart: string;
  vendor: string;
  companies: string;
  logisticsCompanies: string;
  inventory: string;
  shipments: string;
  adminShipments: string;
  companyShipments: string;
  adminStorage: string;
  field: string;
  storage: string;
  companyStores: string;
  companySales: string;
}

export interface ApiConfiguration {
  dataSource: 'api' | 'mock';
  authType: 'bearer' | 'cookie';
  withCredentials?: boolean;
  endpoints: ApiEndpointsConfig;
}
