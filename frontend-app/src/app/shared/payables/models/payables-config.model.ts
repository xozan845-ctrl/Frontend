/** Ámbito de las cuentas por pagar: empresa o tienda del vendedor. */
export interface PayablesScopeConfig {
  scope: 'company' | 'vendor';
  /** Prefijo de almacenamiento: cuenta de empresa o tienda. */
  storageScope: 'company' | 'store';
  title: string;
  subtitle: string;
}
