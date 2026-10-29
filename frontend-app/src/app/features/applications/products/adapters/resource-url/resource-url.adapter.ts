/**
 * Resuelve las rutas públicas que devuelve Core Engine.
 *
 * El gateway puede devolver `/api/v1/storage/...` como ruta relativa. El
 * `apiUrl` del frontend puede incluir un prefijo adicional (`/api-proxy`), por
 * lo que `new URL(relative, apiUrl)` no es correcto en producción.
 */
export function resolveProductResourceUrl(value: unknown, apiUrl?: string): string {
  if (typeof value !== 'string' || !value.trim()) return '';
  const url = value.trim();
  if (/^(?:https?:|data:|blob:)/i.test(url) || !apiUrl || !url.startsWith('/')) return url;

  const base = apiUrl.replace(/\/api\/v1\/?$/, '');
  return `${base}${url}`;
}
