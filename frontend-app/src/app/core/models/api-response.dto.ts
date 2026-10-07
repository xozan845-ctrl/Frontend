/**
 * Respuesta genérica paginada / envuelta habitual en APIs RESTful (NestJS, Spring, Django, Laravel, etc.)
 */
export interface PaginatedApiResponse<T> {
  data?: T[];
  items?: T[];
  results?: T[];
  total?: number;
  count?: number;
  page?: number;
  limit?: number;
  pageSize?: number;
  totalPages?: number;
}

/**
 * Respuesta genérica para un solo elemento
 */
export interface SingleApiResponse<T> {
  data?: T;
  item?: T;
  result?: T;
}

/**
 * Utilidad pura para extraer listas de respuestas de backend,
 * sin importar si vienen como array directo [ ... ] o envueltas en { data: [ ... ] }, { items: [ ... ] }, etc.
 */
export function unwrapApiListResponse<T>(response: unknown): T[] {
  if (!response) return [];
  if (Array.isArray(response)) return response as T[];

  if (typeof response === 'object') {
    const r = response as Record<string, unknown>;
    if (Array.isArray(r['data'])) return r['data'] as T[];
    if (Array.isArray(r['items'])) return r['items'] as T[];
    if (Array.isArray(r['results'])) return r['results'] as T[];
    if (Array.isArray(r['products'])) return r['products'] as T[];
  }

  return [];
}

/**
 * Utilidad pura para extraer un elemento de backend,
 * ya sea que venga directo { id: ... } o envuelto en { data: { ... } }
 */
export function unwrapApiSingleResponse<T>(response: unknown): T | null {
  if (!response || typeof response !== 'object') return null;

  const r = response as Record<string, unknown>;
  if (r['data'] && typeof r['data'] === 'object' && !Array.isArray(r['data'])) {
    return r['data'] as T;
  }
  if (r['item'] && typeof r['item'] === 'object' && !Array.isArray(r['item'])) {
    return r['item'] as T;
  }
  if (r['result'] && typeof r['result'] === 'object' && !Array.isArray(r['result'])) {
    return r['result'] as T;
  }

  return response as T;
}
