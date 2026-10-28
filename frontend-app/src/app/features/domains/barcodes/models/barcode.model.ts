export type BarcodeSymbology = 'EAN13' | 'CODE128';

export interface BarcodeLabel {
  id: string;
  productName: string;
  sku: string;
  code: string;
  symbology: BarcodeSymbology;
  /** Etiquetas a imprimir; entre 1 y 100. */
  copies: number;
  /** ISO 8601 UTC. */
  createdAt: string;
}

export interface CreateBarcodeLabelPayload {
  productName: string;
  sku: string;
  /** Vacío = el dominio genera un código válido para la simbología. */
  code: string;
  symbology: BarcodeSymbology;
  copies: number;
}

export interface BarcodesSummary {
  labelsCount: number;
  totalCopies: number;
}

export interface BarcodesMutationResult {
  ok: boolean;
  message?: string;
}
