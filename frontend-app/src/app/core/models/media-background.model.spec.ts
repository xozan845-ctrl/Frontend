import {
  EMPTY_MEDIA_BACKGROUND,
  MediaBackgroundConfig,
  clampMediaBackgroundOverlay,
  hasVisibleMediaBackground,
} from './media-background.model';

const visible: MediaBackgroundConfig = {
  ...EMPTY_MEDIA_BACKGROUND,
  objectId: 'bg-1',
  mediaType: 'imagen',
  url: 'https://cdn.test/bg.jpg',
  active: true,
};

describe('media-background.model', () => {
  it('solo considera visible un fondo activo con URL y tipo válidos', () => {
    expect(hasVisibleMediaBackground(visible)).toBe(true);
    expect(hasVisibleMediaBackground({ ...visible, active: false })).toBe(false);
    expect(hasVisibleMediaBackground({ ...visible, url: null })).toBe(false);
    expect(hasVisibleMediaBackground({ ...visible, mediaType: null })).toBe(false);
    expect(hasVisibleMediaBackground(null)).toBe(false);
  });

  it('acota el overlay al rango 0–100 y usa 35 si no es finito', () => {
    expect(clampMediaBackgroundOverlay(-10)).toBe(0);
    expect(clampMediaBackgroundOverlay(140)).toBe(100);
    expect(clampMediaBackgroundOverlay(40.4)).toBe(40);
    expect(clampMediaBackgroundOverlay(Number.NaN)).toBe(35);
  });
});
