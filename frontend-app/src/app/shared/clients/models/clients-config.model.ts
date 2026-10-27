/** Configuración de presentación de la página de clientes por workspace. */
export interface ClientsPageConfig {
  /** Título visible y de SEO. */
  title: string;
  /** Subtítulo descriptivo de la cartera. */
  subtitle: string;
  /** Etiqueta del enlace de inicio en la miga de pan. */
  homeLabel: string;
  /** Ruta de inicio del workspace activo. */
  homeLink: string;
  /** Habilita la importación CSV en este ámbito. */
  importEnabled: boolean;
}

/** Ámbito y endpoint de órdenes que alimentan la cartera. */
export interface ClientsScopeConfig {
  scope: 'company' | 'vendor';
  /** Sufijo del endpoint de órdenes, p. ej. `/empresa`. */
  ordersPath: string;
}
