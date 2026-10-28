import type { PayablesScopeConfig } from '../../../shared/payables/models/payables-config.model';

/** Configuración de cuentas por pagar en la tienda del vendedor. */
export const VENDOR_PAYABLES_SCOPE_CONFIG: PayablesScopeConfig = {
  scope: 'vendor',
  storageScope: 'store',
  title: 'Cuentas por pagar',
  subtitle: 'Controla las obligaciones de tu tienda y su vencimiento.',
};
