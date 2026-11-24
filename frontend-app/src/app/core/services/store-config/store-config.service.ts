import { computed, Injectable, signal } from '@angular/core';
import { CURRENCY } from '../../config/currency.config';
import { createNeutralCompanyInfo } from '../../constants/company.constants';
import type {
  CompanyInfo,
  StorefrontBenefit,
  StorefrontPolicy,
  StorefrontSupport,
} from '../../models/company.model';

const text = (value: string | undefined): string | undefined =>
  typeof value === 'string' && value.trim() ? value.trim() : undefined;

/** Solo se publican los canales que el operador confirmó explícitamente. */
function normalizeSupport(support: StorefrontSupport | undefined): StorefrontSupport | undefined {
  if (!support) return undefined;

  const candidate: StorefrontSupport = {
    label: text(support.label),
    email: text(support.email),
    whatsappPhone: text(support.whatsappPhone),
    whatsappMessage: text(support.whatsappMessage),
    responseTime: text(support.responseTime),
    note: text(support.note),
  };

  return Object.values(candidate).some(Boolean) ? candidate : undefined;
}

function normalizePolicies(policies: readonly StorefrontPolicy[] | undefined): StorefrontPolicy[] {
  return (policies ?? []).flatMap((policy) => {
    const label = text(policy.label);
    const url = text(policy.url);
    return label && url ? [{ label, url }] : [];
  });
}

function normalizeBenefits(
  benefits: readonly StorefrontBenefit[] | undefined,
): StorefrontBenefit[] {
  return (benefits ?? []).flatMap((benefit) => {
    const icon = text(benefit.icon);
    const title = text(benefit.title);
    if (!icon || !title) return [];
    return [{ icon, title, subtitle: text(benefit.subtitle) }];
  });
}

/** Reemplaza el contexto: nunca mezcla valores del operador anterior. */
function normalize(config: Partial<CompanyInfo> | null | undefined): CompanyInfo {
  const base = createNeutralCompanyInfo();
  if (!config) return base;

  const currency = config.currency;
  const newsletter = config.newsletter;

  return {
    ...base,
    name: text(config.name),
    description: text(config.description),
    phone: text(config.phone),
    displayPhone: text(config.displayPhone),
    email: text(config.email),
    location: text(config.location),
    whatsappMessage: text(config.whatsappMessage),
    currency:
      currency?.code && currency?.locale
        ? { code: currency.code, locale: currency.locale }
        : base.currency,
    socials: {
      twitter: text(config.socials?.twitter),
      instagram: text(config.socials?.instagram),
      github: text(config.socials?.github),
    },
    support: normalizeSupport(config.support),
    policies: normalizePolicies(config.policies),
    benefits: normalizeBenefits(config.benefits),
    newsletter:
      text(newsletter?.title) || text(newsletter?.description)
        ? { title: text(newsletter?.title), description: text(newsletter?.description) }
        : undefined,
  };
}

@Injectable({
  providedIn: 'root',
})
export class StoreConfigService {
  private readonly _companyInfo = signal<CompanyInfo>(createNeutralCompanyInfo());
  private readonly _contextId = signal<string | null>(null);

  readonly companyInfo = this._companyInfo.asReadonly();
  readonly contextId = this._contextId.asReadonly();
  readonly currency = computed(() => this._companyInfo().currency ?? CURRENCY);
  readonly support = computed<StorefrontSupport | undefined>(() => this._companyInfo().support);
  readonly policies = computed(() => this._companyInfo().policies ?? []);
  readonly benefits = computed(() => this._companyInfo().benefits ?? []);

  /**
   * Carga un contexto nuevo desde cero. Al cambiar de `contextId` (o al recibir
   * `null`) se descartan identidad, contactos, enlaces y beneficios anteriores.
   */
  setContext(contextId: string | null, config?: Partial<CompanyInfo> | null): void {
    this._contextId.set(contextId);
    this._companyInfo.set(normalize(config));
  }

  /**
   * Compatible con el contrato anterior, pero con semántica de reemplazo:
   * un partial no se fusiona con la tienda previa (R-SH-4, R-AR-11).
   */
  updateConfig(config: Partial<CompanyInfo>): void {
    this.setContext(this._contextId(), config);
  }

  /** Vuelve a la identidad neutra; usado al salir del storefront. */
  clear(): void {
    this.setContext(null, null);
  }
}
