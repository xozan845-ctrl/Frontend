/** Modo del asistente: compra real u orden de compra. */
export type WizardMode = 'compra' | 'orden';

/** Pantalla actual del asistente. */
export type WizardStage = 'choice' | 'wizard' | 'new-product';

/** Paso del asistente. */
export interface WizardStep {
  value: number;
  label: string;
}
