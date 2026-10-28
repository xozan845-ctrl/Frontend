/** Paso del asistente de creación de tienda. */
export interface WizardStep {
  id: number;
  label: string;
}

/** Pasos: 1 Cuenta · 2 Negocio · 3 Productos · 4 Listo. */
export const WIZARD_STEPS: readonly WizardStep[] = [
  { id: 1, label: 'Cuenta' },
  { id: 2, label: 'Negocio' },
  { id: 3, label: 'Productos' },
  { id: 4, label: 'Listo' },
];

/** Opción del catálogo global para publicar como oferta (`GET /catalog/productos`). */
export interface CatalogProductOption {
  id: string;
  name: string;
  sku: string;
}

/** Modalidad logística que se elige al crear la empresa en el onboarding. */
export type StoreCompanyMode = 'plataforma' | 'propia' | 'hibrida';

/** Empresa que se crea junto a la tienda cuando el usuario aún no tiene tenant. */
export interface StoreCompanySetup {
  name: string;
  logisticsMode: StoreCompanyMode;
}

/** Datos del formulario de creación de tienda (`POST /vendedores/tienda`). */
export interface StoreDraft {
  name: string;
  description: string;
  /** Solo se envía si el empresario aún no tiene empresa (`POST /empresas`). */
  company?: StoreCompanySetup;
}

/** Oferta a publicar (`POST /vendedores/productos`): margen en enteros 0–90. */
export interface OfferDraft {
  productId: string;
  margin: number;
}

/** Producto maestro que el empresario crea durante el onboarding. */
export interface CreateStoreProductDraft {
  sku: string;
  name: string;
  description: string;
  category: string;
  basePrice: string;
  stock: number;
  margin: number;
}
