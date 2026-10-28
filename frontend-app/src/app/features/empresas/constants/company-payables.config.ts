import type { PayablesScopeConfig } from '../../../shared/payables/models/payables-config.model';

/** Configuración de cuentas por pagar en el workspace de empresa. */
export const COMPANY_PAYABLES_SCOPE_CONFIG: PayablesScopeConfig = {
  scope: 'company',
  storageScope: 'company',
  title: 'Cuentas por pagar',
  subtitle: 'Controla las obligaciones con proveedores y su vencimiento.',
};
