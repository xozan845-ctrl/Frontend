/** Paso del asistente de creación de tienda. */
export interface WizardStep {
  id: number;
  label: string;
}

/** Pasos: 1 Cuenta · 2 Tienda · 3 Productos · 4 Listo. */
export const WIZARD_STEPS: readonly WizardStep[] = [
  { id: 1, label: 'Cuenta' },
  { id: 2, label: 'Tienda' },
  { id: 3, label: 'Productos' },
  { id: 4, label: 'Listo' },
];

/** Opción del catálogo global para publicar como oferta (`GET /catalog/productos`). */
export interface CatalogProductOption {
  id: string;
  name: string;
  sku: string;
}

/** Datos del formulario de creación de tienda (`POST /vendedores/tienda`). */
export interface StoreDraft {
  name: string;
  description: string;
}

/** Oferta a publicar (`POST /vendedores/productos`): margen en enteros 0–90. */
export interface OfferDraft {
  productId: string;
  margin: number;
}
