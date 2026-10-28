/** Ámbito de las cuentas bancarias: empresa o tienda del vendedor. */
export interface BanksScopeConfig {
  scope: 'company' | 'vendor';
  storageScope: 'company' | 'store';
  title: string;
  subtitle: string;
}
