/** Contrato de configuración del API (tipos puros). */
export interface ApiEndpointsConfig {
  products: string;
  categories: string;
  storefront: string;
  auth: string;
  orders: string;
  cart: string;
  vendor: string;
  companies: string;
  inventory: string;
  shipments: string;
  adminShipments: string;
  companyShipments: string;
  adminStorage: string;
  field: string;
}

export interface ApiConfiguration {
  dataSource: 'api' | 'mock';
  authType: 'bearer' | 'cookie';
  withCredentials?: boolean;
  endpoints: ApiEndpointsConfig;
}
