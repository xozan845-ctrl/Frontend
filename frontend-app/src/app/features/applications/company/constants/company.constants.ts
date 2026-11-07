import type { CompanyType, LogisticsMode } from '../models/company.model';

/** Opciones de modalidad logística con su texto para la UI. */
export const LOGISTICS_MODE_OPTIONS: readonly {
  value: LogisticsMode;
  label: string;
  description: string;
}[] = [
  {
    value: 'plataforma',
    label: 'Plataforma',
    description: 'La logística global de la plataforma gestiona los envíos.',
  },
  {
    value: 'propia',
    label: 'Propia',
    description: 'Tu empresa opera su propia flota y rutas.',
  },
  {
    value: 'hibrida',
    label: 'Híbrida',
    description: 'Eliges la flota para cada envío.',
  },
];

/** Opciones del tipo de empresa con su texto para la UI (`tipo_empresa`). */
export const COMPANY_TYPE_OPTIONS: readonly {
  value: CompanyType;
  label: string;
  description: string;
}[] = [
  {
    value: 'comercial',
    label: 'Comercial',
    description: 'Vende productos o servicios con catálogo propio.',
  },
  {
    value: 'logistica',
    label: 'Logística',
    description: 'Opera envíos y rutas para otras empresas.',
  },
  {
    value: 'plataforma',
    label: 'Plataforma',
    description: 'Administra la operación global del marketplace.',
  },
];

/** Monedas ISO 4217 admitidas por el alta y el perfil de empresa. */
export const CURRENCY_OPTIONS: readonly { value: string; label: string }[] = [
  { value: 'NIO', label: 'Córdoba nicaragüense (NIO)' },
  { value: 'USD', label: 'Dólar estadounidense (USD)' },
];

/** Etiqueta legible de una modalidad logística. */
export function logisticsModeLabel(mode: LogisticsMode): string {
  return LOGISTICS_MODE_OPTIONS.find((option) => option.value === mode)?.label ?? mode;
}

/** Etiqueta legible de un tipo de empresa. */
export function companyTypeLabel(type: CompanyType): string {
  return COMPANY_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? type;
}
