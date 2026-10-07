export interface ApiEndpointsConfig {
  products: string;
  categories: string;
  storefront: string;
  auth: string;
  orders: string;
}

export interface ApiConfiguration {
  dataSource: 'api' | 'mock';
  authType: 'bearer' | 'cookie';
  withCredentials?: boolean;
  /** Tienda cuyas ofertas consume el storefront (Core Engine es multi-tienda). */
  storeId: string;
  endpoints: ApiEndpointsConfig;
}

export const DEFAULT_API_CONFIG: ApiConfiguration = {
  dataSource: 'api',
  authType: 'bearer',
  withCredentials: false,
  storeId: '',
  endpoints: {
    products: '/catalog/productos',
    categories: '/catalog/productos',
    storefront: '/tiendas',
    auth: '/auth',
    orders: '/orders',
  },
};
