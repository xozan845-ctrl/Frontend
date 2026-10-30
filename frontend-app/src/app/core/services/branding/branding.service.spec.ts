import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { BrandingService } from './branding.service';

describe('BrandingService', () => {
  let service: BrandingService;
  let doc: Document;

  const setup = () => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BrandingService);
    doc = TestBed.inject(DOCUMENT);
    doc.head.querySelectorAll('link[rel="icon"], link[rel="apple-touch-icon"]').forEach((link) => {
      link.remove();
    });
  };

  beforeEach(() => setup());
  afterEach(() => TestBed.resetTestingModule());

  it('debe crear y actualizar el favicon con el logo de la empresa', () => {
    service.setLogo('https://cdn.test/logo.png');

    const icon = doc.head.querySelector<HTMLLinkElement>('link[rel="icon"]');
    const apple = doc.head.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');
    expect(icon?.getAttribute('href')).toBe('https://cdn.test/logo.png');
    expect(icon?.getAttribute('type')).toBe('image/png');
    expect(apple?.getAttribute('href')).toBe('https://cdn.test/logo.png');
  });

  it('debe restaurar los iconos por defecto', () => {
    service.setLogo('https://cdn.test/logo.svg');
    service.reset();

    const icon = doc.head.querySelector<HTMLLinkElement>('link[rel="icon"]');
    const apple = doc.head.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');
    expect(icon?.getAttribute('href')).toBe('favicon.ico');
    expect(icon?.getAttribute('type')).toBe('image/x-icon');
    expect(apple?.getAttribute('href')).toBe('icon.svg');
    expect(apple?.getAttribute('type')).toBe('image/svg+xml');
  });

  it('debe ignorar un logo vacío', () => {
    service.setLogo('   ');

    expect(doc.head.querySelector<HTMLLinkElement>('link[rel="icon"]')?.getAttribute('href')).toBe(
      'favicon.ico',
    );
  });
});
