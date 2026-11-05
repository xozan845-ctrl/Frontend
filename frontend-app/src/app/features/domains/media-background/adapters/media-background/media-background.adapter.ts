import { resolveApiAssetUrl } from '../../../../../core/config/asset-url.config';
import {
  EMPTY_MEDIA_BACKGROUND,
  MediaBackgroundConfig,
  MediaBackgroundMediaType,
  MediaBackgroundPosition,
  clampMediaBackgroundOverlay,
} from '../../../../../core/models/media-background.model';

const POSITIONS: readonly MediaBackgroundPosition[] = ['center', 'top', 'bottom', 'left', 'right'];

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

/**
 * Desenvuelve `{ data }`, `{ item }` o el envelope del storefront `{ tienda }`.
 * `GET /tiendas/:id` devuelve `{ tienda, ofertas }`.
 */
function unwrap(raw: unknown): Record<string, unknown> | null {
  const record = asRecord(raw);
  if (!record) return null;
  const tienda = asRecord(record['tienda']);
  if (tienda) return tienda;
  const data = asRecord(record['data']);
  if (data) return data;
  const item = asRecord(record['item']);
  if (item) return item;
  return record;
}

function readNullableString(
  record: Record<string, unknown>,
  keys: readonly string[],
): string | null {
  for (const key of keys) {
    if (!(key in record)) continue;
    const value = record[key];
    if (value === null || value === '') return null;
    if (typeof value === 'string') return value.trim() || null;
  }
  return null;
}

function readString(record: Record<string, unknown>, keys: readonly string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

function readNumber(record: Record<string, unknown>, keys: readonly string[]): number | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) {
      return Number(value);
    }
  }
  return null;
}

function readBoolean(
  record: Record<string, unknown>,
  keys: readonly string[],
  fallback: boolean,
): boolean {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'boolean') return value;
    if (value === 'true' || value === 1) return true;
    if (value === 'false' || value === 0) return false;
  }
  return fallback;
}

function toMediaType(value: string | null, url: string | null): MediaBackgroundMediaType | null {
  if (value === 'video') return 'video';
  if (value === 'imagen' || value === 'image') return 'imagen';

  // Tolerancia para respuestas antiguas: si el tipo no viene, se infiere de la
  // extensión del archivo; el backend siempre debería enviarlo.
  const path = (url ?? '').split(/[?#]/)[0]?.toLowerCase() ?? '';
  if (/\.(mp4|webm|mov|m4v|ogv)$/.test(path)) return 'video';
  return url ? 'imagen' : null;
}

function toPosition(value: string | null): MediaBackgroundPosition {
  return POSITIONS.includes(value as MediaBackgroundPosition)
    ? (value as MediaBackgroundPosition)
    : 'center';
}

/**
 * Normaliza los campos `background_*` de plataforma, empresa o tienda. Es
 * tolerante a `snake_case`/`camelCase` y a los envelopes más comunes del API.
 * Si no hay `background_objeto_id`, devuelve la configuración vacía.
 *
 * `prefijo` permite reutilizar el mismo adapter para el bloque
 * `panel_ai_background_*` de la configuración de plataforma (ADR-40).
 */
export function adaptMediaBackgroundFromBackend(
  raw: unknown,
  prefijo = 'background',
): MediaBackgroundConfig {
  const record = unwrap(raw);
  if (!record) return { ...EMPTY_MEDIA_BACKGROUND };

  const claves = (campo: string, camel: string): string[] =>
    prefijo === 'background' ? [`background_${campo}`, camel] : [`${prefijo}_${campo}`];

  const objectId = readNullableString(record, claves('objeto_id', 'backgroundObjectId'));
  if (!objectId) return { ...EMPTY_MEDIA_BACKGROUND };

  const url = resolveApiAssetUrl(readNullableString(record, claves('url', 'backgroundUrl')));
  const posterObjectId = readNullableString(
    record,
    claves('poster_objeto_id', 'backgroundPosterObjectId'),
  );
  const posterUrl = resolveApiAssetUrl(
    readNullableString(record, claves('poster_url', 'backgroundPosterUrl')),
  );
  const mediaType = toMediaType(
    readString(record, claves('media_type', 'backgroundMediaType')),
    url,
  );

  return {
    objectId,
    mediaType,
    url,
    posterObjectId,
    posterUrl,
    alt: (readString(record, claves('alt', 'backgroundAlt')) ?? '').slice(0, 160),
    overlay: clampMediaBackgroundOverlay(
      readNumber(record, claves('overlay', 'backgroundOverlay')) ?? EMPTY_MEDIA_BACKGROUND.overlay,
    ),
    position: toPosition(readString(record, claves('position', 'backgroundPosition'))),
    active: readBoolean(record, claves('activo', 'backgroundActivo'), false),
  };
}

/** Fondo del panel de IA (`panel_ai_background_*`, ADR-40). */
export function adaptPanelAiMediaBackgroundFromBackend(raw: unknown): MediaBackgroundConfig {
  return adaptMediaBackgroundFromBackend(raw, 'panel_ai_background');
}
