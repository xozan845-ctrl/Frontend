import { OperatorFunction, catchError, throwError } from 'rxjs';
import { toUserMessage } from '../../../core/models/api-error';

/**
 * Traduce cualquier error de la capa HTTP a un mensaje de dominio listo para la
 * UI (`R-AR-9`, `R-UX-4`). El mensaje que envía el backend tiene prioridad.
 */
export function fail<T>(fallback: string): OperatorFunction<T, T> {
  return catchError((error: unknown) =>
    throwError(() => new Error(toUserMessage(error, fallback))),
  );
}

/** Exige que un adapter haya producido un valor; si no, lanza error de dominio. */
export function requireValue<T>(value: T | null, message: string): T {
  if (value === null) throw new Error(message);
  return value;
}
