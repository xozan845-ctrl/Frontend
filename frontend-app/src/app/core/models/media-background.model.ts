/** Tipo de medio que el backend deriva del `content_type` real del objeto. */
export type MediaBackgroundMediaType = 'imagen' | 'video';

/** Posición del recorte, equivalente directo de `object-position` en CSS. */
export type MediaBackgroundPosition = 'center' | 'top' | 'bottom' | 'left' | 'right';

/**
 * Configuración normalizada de un fondo multimedia. El backend es la fuente de
 * verdad: `objectId`, `mediaType` y las URLs se derivan de `background_*` y
 * nunca se construyen desde la UI.
 */
export interface MediaBackgroundConfig {
  /** UUID del objeto de storage; `null` cuando el ámbito no tiene fondo. */
  objectId: string | null;
  /** Tipo real del objeto; `null` si no hay fondo. */
  mediaType: MediaBackgroundMediaType | null;
  /** URL pública resuelta contra el origen del API. */
  url: string | null;
  /** UUID del poster (solo video). */
  posterObjectId: string | null;
  /** URL pública del poster resuelta contra el origen del API. */
  posterUrl: string | null;
  /** Texto alternativo; cadena vacía para fondos decorativos. */
  alt: string;
  /** Opacidad del velo oscuro, 0–100. */
  overlay: number;
  position: MediaBackgroundPosition;
  active: boolean;
}

/** Configuración vacía: no hay fondo que mostrar. */
export const EMPTY_MEDIA_BACKGROUND: Readonly<MediaBackgroundConfig> = Object.freeze({
  objectId: null,
  mediaType: null,
  url: null,
  posterObjectId: null,
  posterUrl: null,
  alt: '',
  overlay: 35,
  position: 'center',
  active: false,
});

/** `true` solo cuando el backend marcó un fondo con URL y tipo válidos. */
export function hasVisibleMediaBackground(
  config: MediaBackgroundConfig | null | undefined,
): config is MediaBackgroundConfig {
  return Boolean(
    config?.active && config.url && (config.mediaType === 'imagen' || config.mediaType === 'video'),
  );
}

/** Limita el overlay al rango contractual 0–100. */
export function clampMediaBackgroundOverlay(value: number): number {
  if (!Number.isFinite(value)) return EMPTY_MEDIA_BACKGROUND.overlay;
  return Math.min(100, Math.max(0, Math.round(value)));
}
