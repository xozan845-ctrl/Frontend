/**
 * Resultado de restaurar datos persistidos en el navegador.
 *
 * `value` siempre contiene datos válidos del dominio. La recuperación se
 * expresa con metadatos estables, sin exponer el JSON crudo ni el motor de
 * almacenamiento que se haya usado.
 */
export type LocalStateRecoveryReason =
  | 'invalid-json'
  | 'invalid-shape'
  | 'unsupported-version'
  | 'foreign-context'
  | 'storage-unavailable'
  | 'partially-discarded';

export interface LocalStateResult<T> {
  /** Datos válidos listos para el store. */
  value: T;
  /** `true` si se restauró al menos una entrada válida. */
  restored: boolean;
  /** `true` si hubo datos corruptos, inválidos o de otro contexto. */
  recovered: boolean;
  /** Entradas descartadas por inválidas, duplicadas o por exceder el límite. */
  discarded: number;
  /** Motivo explícito de recuperación; `null` si todo era válido. */
  reason: LocalStateRecoveryReason | null;
  /** Mensaje estable, independiente del adaptador de almacenamiento. */
  message: string | null;
}

/** Envelope versionado que se escribe en el almacenamiento local. */
export interface LocalStateEnvelope<T> {
  version: number;
  context: string;
  items: T[];
}

/** Colección normalizada desde un valor persistido desconocido. */
export interface NormalizedCollection<T> {
  items: T[];
  discarded: number;
  /** `true` si el dato venía en el formato legado (array plano). */
  legacy: boolean;
}

export type NormalizedCollectionResult<T> =
  | ({ ok: true } & NormalizedCollection<T>)
  | {
      ok: false;
      reason: 'invalid-shape' | 'unsupported-version' | 'foreign-context';
    };

/** Valor JSON desconocido con forma de objeto (no arreglo). */
export type UnknownRecord = Record<string, unknown>;

/** Normalizador puro de una colección persistida. */
export type CollectionNormalizer<T> = (raw: unknown) => NormalizedCollectionResult<T>;
