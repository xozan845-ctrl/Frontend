import { environment } from '../../../../../../environments/environment';
import { adaptMediaBackgroundFromBackend } from './media-background.adapter';
import {
  MEDIA_BACKGROUND_PLATFORM_FIXTURE,
  MEDIA_BACKGROUND_STORE_FIXTURE,
} from './fixtures/media-background.fixture';

const ASSET = `${new URL(environment.apiUrl).origin}/api/v1/storage/public/objetos`;

// R-C-8: contrato contra fixture versionado del backend, no contra el servicio en vivo.
describe('media-background.contract', () => {
  it('debe normalizar el fondo de plataforma (video con poster)', () => {
    expect(adaptMediaBackgroundFromBackend(MEDIA_BACKGROUND_PLATFORM_FIXTURE)).toEqual({
      objectId: '11111111-2222-4333-8444-555555555555',
      mediaType: 'video',
      url: `${ASSET}/11111111-2222-4333-8444-555555555555`,
      posterObjectId: '99999999-8888-4777-8666-555555555555',
      posterUrl: `${ASSET}/99999999-8888-4777-8666-555555555555`,
      alt: 'Internacional',
      overlay: 40,
      position: 'center',
      active: true,
    });
  });

  it('debe normalizar el fondo de tienda dentro de `{ tienda, ofertas }`', () => {
    expect(adaptMediaBackgroundFromBackend(MEDIA_BACKGROUND_STORE_FIXTURE)).toEqual({
      objectId: '22222222-3333-4444-8555-666666666666',
      mediaType: 'imagen',
      url: `${ASSET}/22222222-3333-4444-8555-666666666666`,
      posterObjectId: null,
      posterUrl: null,
      alt: 'Colección',
      overlay: 35,
      position: 'center',
      active: true,
    });
  });
});
