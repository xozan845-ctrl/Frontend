import type { BanksScopeConfig } from '../../../shared/banks/models/banks-config.model';

/** Configuración de bancos en la tienda del vendedor. */
export const VENDOR_BANKS_SCOPE_CONFIG: BanksScopeConfig = {
  scope: 'vendor',
  storageScope: 'store',
  title: 'Bancos',
  subtitle: 'Administra las cuentas bancarias de tu tienda y sus saldos.',
};
