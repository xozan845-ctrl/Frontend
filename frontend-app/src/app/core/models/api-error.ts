import { HttpErrorResponse } from '@angular/common/http';

/**
 * Traduce un error técnico (típicamente `HttpErrorResponse`) a un mensaje de
 * dominio listo para mostrar al usuario (`R-UX-4`, `R-AR-9`). Centraliza el
 * mapeo por código HTTP para no filtrar detalles de infraestructura a la UI.
 */
export function toUserMessage(error: unknown, fallback: string): string {
  if (error instanceof HttpErrorResponse) {
    switch (error.status) {
      case 0:
        return 'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.';
      case 400:
        return 'Revisa los datos e inténtalo de nuevo.';
      case 403:
        return 'Necesitas una cuenta de vendedor para esta acción.';
      case 409:
        return 'Ya tienes una tienda creada.';
      default:
        return fallback;
    }
  }
  return (error as Error)?.message || fallback;
}
