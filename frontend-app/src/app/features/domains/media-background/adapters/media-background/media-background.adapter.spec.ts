import { environment } from '../../../../../../environments/environment';
import { EMPTY_MEDIA_BACKGROUND } from '../../../../../core/models/media-background.model';
import {
  adaptMediaBackgroundFromBackend,
  adaptPanelAiMediaBackgroundFromBackend,
} from './media-background.adapter';

const ASSET = `${new URL(environment.apiUrl).origin}/api/v1/storage/public/objetos`;

describe('adaptMediaBackgroundFromBackend', () => {
  it('normaliza un video de plataforma y resuelve sus URLs públicas', () => {
    const config = adaptMediaBackgroundFromBackend({
      background_objeto_id: 'video-1',
      background_media_type: 'video',
      background_url: '/api/v1/storage/public/objetos/video-1',
      background_poster_objeto_id: 'poster-1',
      background_poster_url: '/api/v1/storage/public/objetos/poster-1',
      background_alt: 'Colección internacional',
      background_overlay: 40,
      background_position: 'top',
      background_activo: true,
    });

    expect(config).toEqual({
      objectId: 'video-1',
      mediaType: 'video',
      url: `${ASSET}/video-1`,
      posterObjectId: 'poster-1',
      posterUrl: `${ASSET}/poster-1`,
      alt: 'Colección internacional',
      overlay: 40,
      position: 'top',
      active: true,
    });
  });

  it('desenvuelve el storefront `{ tienda }` de GET /tiendas/:id', () => {
    const config = adaptMediaBackgroundFromBackend({
      tienda: {
        id: 't-1',
        background_objeto_id: 'img-1',
        background_media_type: 'imagen',
        background_url: '/api/v1/storage/public/objetos/img-1',
        background_activo: true,
      },
      ofertas: [],
    });

    expect(config.objectId).toBe('img-1');
    expect(config.mediaType).toBe('imagen');
    expect(config.url).toBe(`${ASSET}/img-1`);
  });

  it('devuelve la configuración vacía cuando no hay objeto', () => {
    expect(
      adaptMediaBackgroundFromBackend({
        background_objeto_id: null,
        background_activo: true,
      }),
    ).toEqual(EMPTY_MEDIA_BACKGROUND);
    expect(adaptMediaBackgroundFromBackend(null)).toEqual(EMPTY_MEDIA_BACKGROUND);
  });

  it('tolera camelCase, infiere el tipo por extensión y acota metadatos', () => {
    const config = adaptMediaBackgroundFromBackend({
      backgroundObjectId: 'clip-1',
      backgroundUrl: '/api/v1/storage/public/objetos/clip-1.webm',
      backgroundAlt: '  Fondo  ',
      backgroundOverlay: 140,
      backgroundPosition: 'diagonal',
      backgroundActivo: true,
    });

    expect(config.mediaType).toBe('video');
    expect(config.alt).toBe('Fondo');
    expect(config.overlay).toBe(100);
    expect(config.position).toBe('center');
    expect(config.active).toBe(true);
  });

  it('mantiene el fondo inactivo si el backend no lo activa', () => {
    const config = adaptMediaBackgroundFromBackend({
      background_objeto_id: 'img-1',
      background_media_type: 'imagen',
      background_url: '/api/v1/storage/public/objetos/img-1',
      background_activo: false,
    });

    expect(config.objectId).toBe('img-1');
    expect(config.active).toBe(false);
  });

  it('tolera overlay numérico como string, ausencia de activo y tipo implícito', () => {
    const config = adaptMediaBackgroundFromBackend({
      background_objeto_id: 'img-2',
      background_url: '/api/v1/storage/public/objetos/img-2.jpg',
      background_overlay: '55',
    });

    expect(config.mediaType).toBe('imagen');
    expect(config.overlay).toBe(55);
    expect(config.active).toBe(false);
  });

  it('normaliza el bloque panel_ai_background_* del panel de IA (ADR-40)', () => {
    const config = adaptPanelAiMediaBackgroundFromBackend({
      background_objeto_id: 'otro-fondo',
      panel_ai_background_objeto_id: 'ai-video',
      panel_ai_background_media_type: 'video',
      panel_ai_background_url: '/api/v1/storage/public/objetos/ai-video',
      panel_ai_background_poster_objeto_id: 'ai-poster',
      panel_ai_background_poster_url: '/api/v1/storage/public/objetos/ai-poster',
      panel_ai_background_alt: 'Panel IA',
      panel_ai_background_overlay: 60,
      panel_ai_background_position: 'bottom',
      panel_ai_background_activo: true,
    });

    expect(config).toEqual({
      objectId: 'ai-video',
      mediaType: 'video',
      url: `${ASSET}/ai-video`,
      posterObjectId: 'ai-poster',
      posterUrl: `${ASSET}/ai-poster`,
      alt: 'Panel IA',
      overlay: 60,
      position: 'bottom',
      active: true,
    });
  });
});
