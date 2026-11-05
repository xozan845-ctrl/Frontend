import type { Provider } from '@angular/core';
import { MEDIA_BACKGROUND_REPOSITORY } from './repositories/media-background.repository';
import { MediaBackgroundService } from './services/media-background/media-background.service';
import { MediaBackgroundStore } from './state/media-background/media-background.store';

/** API de aplicación pública de `media-background` para dominios consumidores. */
export type {
  MediaBackgroundConfig,
  MediaBackgroundDraft,
} from '../../../core/models/media-background.model';
export { MediaBackgroundStore } from './state/media-background/media-background.store';
export {
  MEDIA_BACKGROUND_REPOSITORY,
  type MediaBackgroundRepository,
} from './repositories/media-background.repository';
export { MediaBackgroundService } from './services/media-background/media-background.service';
export { MediaBackgroundWriteService } from './services/media-background-write/media-background-write.service';
export type { MediaBackgroundSiteScope } from './services/media-background-write/media-background-write.types';
export { MediaBackgroundUploadService } from './services/media-background-upload/media-background-upload.service';
export {
  adaptMediaBackgroundFromBackend,
  adaptPanelAiMediaBackgroundFromBackend,
} from './adapters/media-background/media-background.adapter';

/**
 * Providers del dominio. Se declaran en el componente/ruta que consume el
 * store para que el servicio HTTP y el adapter viajen en el chunk lazy, no en
 * el bundle inicial (R-LZ-1).
 */
export const MEDIA_BACKGROUND_PROVIDERS: Provider[] = [
  MediaBackgroundStore,
  { provide: MEDIA_BACKGROUND_REPOSITORY, useClass: MediaBackgroundService },
];
