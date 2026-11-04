import { environment } from '../../../environments/environment';

/**
 * Resuelve una ruta relativa devuelta por el API contra el origen público.
 * Las URLs absolutas (`http`, `data`, `blob`) se dejan intactas y los valores
 * vacíos se normalizan a `null`.
 *
 * Es la base común para assets de storage (`R-AR-11`): los servicios de
 * dominio devuelven rutas relativas y la capa de presentación las resuelve.
 */
export function resolveApiAssetUrl(value: string | null | undefined): string | null {
  const url = value?.trim();
  if (!url) return null;
  if (/^(https?:|data:|blob:)/i.test(url)) return url;
  if (!url.startsWith('/')) return url;
  try {
    return `${new URL(environment.apiUrl).origin}${url}`;
  } catch {
    return url;
  }
}
