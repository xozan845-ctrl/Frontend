import { HttpErrorResponse } from '@angular/common/http';

/**
 * Traduce un error técnico (típicamente `HttpErrorResponse`) a un mensaje de
 * dominio listo para mostrar al usuario (`R-UX-4`, `R-AR-9`). Prioriza el
 * `mensaje`/`message` que envía el backend (`{ codigo, mensaje, detalles }`,
 * `R-C-2`) y, si no viene, mapea por código HTTP para no filtrar detalles de
 * infraestructura a la UI.
 */
export function toUserMessage(error: unknown, fallback: string): string {
  if (error instanceof HttpErrorResponse) {
    const backend = extractBackendMessage(error.error);
    if (backend) return backend;

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

/** Extrae el mensaje legible del cuerpo de error del backend, si lo trae. */
function extractBackendMessage(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;
  const payload = body as Record<string, unknown>;
  const message = payload['mensaje'] ?? payload['message'];
  return typeof message === 'string' && message.trim() ? message : null;
}
