/** Ámbito de los créditos: empresa o tienda del vendedor. */
export interface CreditsScopeConfig {
  scope: 'company' | 'vendor';
  storageScope: 'company' | 'store';
  title: string;
  subtitle: string;
}
