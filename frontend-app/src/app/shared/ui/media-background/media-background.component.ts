import { DOCUMENT } from '@angular/common';
import { Component, DestroyRef, computed, inject, input, signal } from '@angular/core';
import {
  MediaBackgroundConfig,
  clampMediaBackgroundOverlay,
} from '../../../core/models/media-background.model';

/**
 * Fondo multimedia reutilizable (imagen o video) para hero/portada. Es
 * presentacional: recibe la configuración ya normalizada por el store y no
 * conoce endpoints ni reglas de negocio.
 *
 * Reglas de reproducción:
 * - video: `autoplay`, `muted`, `loop` y `playsinline`;
 * - `prefers-reduced-motion`: se muestra el poster (o el degradado de respaldo)
 *   en lugar del video;
 * - si el video falla, se usa el poster; si la imagen falla, degradado.
 *
 * El host es absoluto: el contenedor debe ser `relative` (o `isolate`) para
 * que el fondo quede detrás del contenido.
 */
@Component({
  selector: 'app-media-background',
  standalone: true,
  templateUrl: './media-background.component.html',
  styleUrl: './media-background.component.css',
})
export class MediaBackgroundComponent {
  readonly config = input<MediaBackgroundConfig | null>(null);
  readonly testId = input('media-background');

  private readonly doc = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly motionQuery =
    this.doc.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)') ?? null;

  readonly reducedMotion = signal(this.motionQuery?.matches ?? false);
  private readonly failedVideoUrl = signal<string | null>(null);
  private readonly failedImageUrl = signal<string | null>(null);
  private readonly watchReducedMotion = this.listenReducedMotion();

  readonly isActive = computed(() => {
    const config = this.config();
    return Boolean(
      config?.active &&
      config.url &&
      (config.mediaType === 'imagen' || config.mediaType === 'video'),
    );
  });

  readonly showVideo = computed(() => {
    const config = this.config();
    return Boolean(
      this.isActive() &&
      config?.mediaType === 'video' &&
      !this.reducedMotion() &&
      config.url !== this.failedVideoUrl(),
    );
  });

  /** Para video se usa el poster; para imagen, el propio fondo. */
  readonly imageUrl = computed(() => {
    const config = this.config();
    if (!config) return null;
    return config.mediaType === 'video' ? config.posterUrl : config.url;
  });

  readonly showImage = computed(() => {
    const url = this.imageUrl();
    return Boolean(this.isActive() && !this.showVideo() && url && url !== this.failedImageUrl());
  });

  readonly showFallback = computed(() => this.isActive() && !this.showVideo() && !this.showImage());

  readonly objectPosition = computed(() => this.config()?.position ?? 'center');

  readonly overlayColor = computed(() => {
    const overlay = clampMediaBackgroundOverlay(this.config()?.overlay ?? 35);
    return `rgba(2, 6, 23, ${overlay / 100})`;
  });

  readonly alt = computed(() => this.config()?.alt ?? '');

  readonly videoMimeType = computed(() => {
    const url = this.config()?.url?.split(/[?#]/)[0]?.toLowerCase() ?? '';
    return url.endsWith('.webm') ? 'video/webm' : 'video/mp4';
  });

  /** Observa cambios de `prefers-reduced-motion` hasta destruir el componente. */
  private listenReducedMotion(): void {
    const query = this.motionQuery;
    if (!query) return;
    const onChange = (event: MediaQueryListEvent) => this.reducedMotion.set(event.matches);
    query.addEventListener?.('change', onChange);
    this.destroyRef.onDestroy(() => query.removeEventListener?.('change', onChange));
  }

  /** El video no pudo cargarse: cae al poster. */
  onVideoError(): void {
    this.failedVideoUrl.set(this.config()?.url ?? null);
  }

  /** La imagen/poster no pudo cargarse: cae al degradado. */
  onImageError(): void {
    this.failedImageUrl.set(this.imageUrl());
  }
}
