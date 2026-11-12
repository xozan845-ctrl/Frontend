import { TestBed } from '@angular/core/testing';
import { MediaBackgroundConfig } from '../../../core/models/media-background.model';
import { MediaBackgroundComponent } from './media-background.component';

const base: MediaBackgroundConfig = {
  objectId: 'bg-1',
  mediaType: 'imagen',
  url: 'https://cdn.test/fondo.jpg',
  posterObjectId: null,
  posterUrl: null,
  alt: 'Fondo de la tienda',
  overlay: 40,
  position: 'top',
  active: true,
};

const video: MediaBackgroundConfig = {
  ...base,
  objectId: 'bg-video',
  mediaType: 'video',
  url: 'https://cdn.test/fondo.webm',
  posterObjectId: 'poster-1',
  posterUrl: 'https://cdn.test/poster.jpg',
};

describe('MediaBackgroundComponent', () => {
  const setup = (config: MediaBackgroundConfig | null) => {
    TestBed.configureTestingModule({ imports: [MediaBackgroundComponent] });
    const fixture = TestBed.createComponent(MediaBackgroundComponent);
    fixture.componentRef.setInput('config', config);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => TestBed.resetTestingModule());
  afterEach(() => vi.unstubAllGlobals());

  it('no debe renderizar medios si el fondo está inactivo o vacío', () => {
    const fixture = setup(null);
    expect(fixture.nativeElement.querySelector('img')).toBeNull();
    expect(fixture.nativeElement.querySelector('video')).toBeNull();

    fixture.componentRef.setInput('config', { ...base, active: false });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('img')).toBeNull();
  });

  it('debe renderizar la imagen con posición y overlay', () => {
    const fixture = setup(base);
    const image = fixture.nativeElement.querySelector('img') as HTMLImageElement;
    const overlay = fixture.nativeElement.querySelector(
      '.media-background__overlay',
    ) as HTMLDivElement;

    expect(image.getAttribute('src')).toBe('https://cdn.test/fondo.jpg');
    expect(image.getAttribute('alt')).toBe('Fondo de la tienda');
    // jsdom 31 normaliza `object-position: top` como `center top`; el requisito
    // es que el fondo quede anclado arriba, no la serialización exacta.
    expect(image.style.objectPosition).toMatch(/^(center\s+)?top$/);
    expect(overlay.style.backgroundColor).toBe('rgba(2, 6, 23, 0.4)');
  });

  it('debe renderizar el video con autoplay silenciado, loop y poster', () => {
    const fixture = setup(video);
    const element = fixture.nativeElement.querySelector('video') as HTMLVideoElement;
    const source = element.querySelector('source') as HTMLSourceElement;

    expect(element.autoplay).toBe(true);
    expect(element.muted).toBe(true);
    expect(element.loop).toBe(true);
    expect(element.getAttribute('poster')).toBe('https://cdn.test/poster.jpg');
    expect(element.getAttribute('aria-hidden')).toBe('true');
    expect(source.getAttribute('type')).toBe('video/webm');
  });

  it('debe caer al poster cuando el video falla', () => {
    const fixture = setup(video);
    fixture.componentInstance.onVideoError();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('video')).toBeNull();
    const image = fixture.nativeElement.querySelector('img') as HTMLImageElement;
    expect(image.getAttribute('src')).toBe('https://cdn.test/poster.jpg');
  });

  it('debe caer al degradado cuando la imagen falla', () => {
    const fixture = setup(base);
    fixture.componentInstance.onImageError();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('img')).toBeNull();
    expect(fixture.nativeElement.querySelector('.media-background__fallback')).not.toBeNull();
  });

  it('debe respetar prefers-reduced-motion mostrando el poster', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );
    const fixture = setup(video);

    expect(fixture.componentInstance.reducedMotion()).toBe(true);
    expect(fixture.nativeElement.querySelector('video')).toBeNull();
    expect(
      (fixture.nativeElement.querySelector('img') as HTMLImageElement).getAttribute('src'),
    ).toBe('https://cdn.test/poster.jpg');
  });
});
