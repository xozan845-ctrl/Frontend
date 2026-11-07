import type { BanksScopeConfig } from '../../../../shared/banks/models/banks-config.model';

/** Configuración de bancos en el workspace de empresa. */
export const COMPANY_BANKS_SCOPE_CONFIG: BanksScopeConfig = {
  scope: 'company',
  storageScope: 'company',
  title: 'Bancos',
  subtitle: 'Administra las cuentas bancarias de la empresa y sus saldos.',
};
