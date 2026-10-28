/** Ámbito de los códigos de barras: empresa o tienda del vendedor. */
export interface BarcodesScopeConfig {
  scope: 'company' | 'vendor';
  storageScope: 'company' | 'store';
  title: string;
  subtitle: string;
}
