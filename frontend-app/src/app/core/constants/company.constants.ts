import { CURRENCY } from '../config/currency.config';
import type { CompanyInfo } from '../models/company.model';

export type {
  CompanyInfo,
  StorefrontBenefit,
  StorefrontNewsletter,
  StorefrontPolicy,
  StorefrontSupport,
} from '../models/company.model';

/**
 * Identidad neutra: no fija marca, teléfono, correo, redes ni promesas.
 * Es el estado inicial de cualquier contexto y el resultado de limpiar uno.
 */
export const COMPANY_INFO: CompanyInfo = {
  currency: { ...CURRENCY },
  socials: {},
  policies: [],
  benefits: [],
};

/** Copia fresca para que dos contextos nunca compartan objetos anidados. */
export function createNeutralCompanyInfo(): CompanyInfo {
  return {
    ...COMPANY_INFO,
    currency: COMPANY_INFO.currency ? { ...COMPANY_INFO.currency } : undefined,
    socials: {},
    policies: [],
    benefits: [],
  };
}
