import type { LogisticsMode } from '../models/company.model';

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

/** Etiqueta legible de una modalidad logística. */
export function logisticsModeLabel(mode: LogisticsMode): string {
  return LOGISTICS_MODE_OPTIONS.find((option) => option.value === mode)?.label ?? mode;
}
