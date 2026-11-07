/**
 * API pública del feature `vendor`: reexporta el dominio de ventas de tienda y
 * expone el estado de branding del shell. Las rutas del panel se cargan de
 * forma perezosa desde `vendor.routes.ts`.
 */
export * from '../../domains/store-sales/public-api';
export { VendorStoreStore } from './state/vendor-store/vendor-store.store';
