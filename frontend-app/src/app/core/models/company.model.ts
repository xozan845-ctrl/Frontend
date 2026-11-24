import type { CurrencyConfig } from './currency-config.model';

/** Enlace informativo aprobado por el operador (R-AR-11, R-UX-1). */
export interface StorefrontPolicy {
  label: string;
  url: string;
}

/** Beneficio que el operador autoriza a mostrar en el storefront. */
export interface StorefrontBenefit {
  icon: string;
  title: string;
  subtitle?: string;
}

/** Canales de soporte confirmados para la tienda activa. */
export interface StorefrontSupport {
  label?: string;
  email?: string;
  whatsappPhone?: string;
  whatsappMessage?: string;
  responseTime?: string;
  note?: string;
}

/** Contenido opcional del boletín; ausente = sección oculta. */
export interface StorefrontNewsletter {
  title?: string;
  description?: string;
}

/**
 * Contrato de identidad y contenido público de una tienda.
 *
 * Todos los campos son opcionales: una tienda nueva no hereda marca, contacto,
 * redes, promesas ni beneficios de otra. El operador confirma cada valor.
 */
export interface CompanyInfo {
  name?: string;
  description?: string;
  currency?: CurrencyConfig;
  phone?: string;
  displayPhone?: string;
  email?: string;
  location?: string;
  whatsappMessage?: string;
  socials?: {
    twitter?: string;
    instagram?: string;
    github?: string;
  };
  support?: StorefrontSupport;
  policies?: readonly StorefrontPolicy[];
  benefits?: readonly StorefrontBenefit[];
  newsletter?: StorefrontNewsletter;
}
