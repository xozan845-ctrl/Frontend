import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { Meta, Title } from '@angular/platform-browser';
import { SeoService } from './seo.service';

describe('SeoService', () => {
  let service: SeoService;
  let title: Title;
  let meta: Meta;
  let doc: Document;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [SeoService, Title, Meta] });
    service = TestBed.inject(SeoService);
    title = TestBed.inject(Title);
    meta = TestBed.inject(Meta);
    doc = TestBed.inject(DOCUMENT);
  });

  afterEach(() => {
    service.reset();
    history.replaceState(null, '', '/');
  });

  it('debe componer el título con el sufijo de la tienda', () => {
    service.updateTitle('Catálogo');

    expect(title.getTitle()).toBe('Catálogo | Quantum Store');
  });

  it('debe actualizar la meta descripción', () => {
    service.updateMeta('Una descripción');

    expect(meta.getTag('name="description"')?.content).toBe('Una descripción');
  });

  it('debe restaurar el título y la descripción por defecto', () => {
    service.updateTitle('Cualquiera');
    service.reset();

    expect(title.getTitle()).toBe('Quantum Store — Hardware Premium');
  });

  it('debe definir los metadatos de la página de producto', () => {
    service.setProductPage('Teclado', 'Un teclado mecánico', 99.5);

    expect(title.getTitle()).toBe('Teclado | Quantum Store');
    expect(meta.getTag('property="og:title"')?.content).toBe('Teclado | Quantum Store');
    expect(meta.getTag('property="og:type"')?.content).toBe('product');
    expect(meta.getTag('property="og:url"')?.content).toBeTruthy();
  });

  it('debe truncar la descripción y añadir el precio en la ficha de producto', () => {
    service.setProductPage('Teclado', 'x'.repeat(300), 99.5);

    expect(meta.getTag('name="description"')?.content).toBe(`${'x'.repeat(150)} — Desde C$99.50`);
    expect(meta.getTag('property="og:description"')?.content).toBe('x'.repeat(200));
  });

  it('debe usar los valores por defecto cuando no se pasan argumentos', () => {
    service.updateTitle();
    service.updateMeta();

    expect(title.getTitle()).toBe('Quantum Store — Hardware Premium');
    expect(meta.getTag('name="description"')?.content).toContain('Selección editorial');
  });

  it('debe configurar una página genérica con título, descripción e imagen social', () => {
    service.setPage('Planes', 'Elige tu membresía');

    expect(title.getTitle()).toBe('Planes | Quantum Store');
    expect(meta.getTag('name="description"')?.content).toBe('Elige tu membresía');
    expect(meta.getTag('property="og:type"')?.content).toBe('website');
    expect(meta.getTag('property="og:image"')?.content).toMatch(/^https?:\/\/.+\/og-image\.png$/);
    expect(meta.getTag('name="twitter:card"')?.content).toBe('summary_large_image');
    expect(meta.getTag('name="twitter:image"')?.content).toMatch(/\/og-image\.png$/);
  });

  it('debe fijar el canonical con la ruta actual, sin query params', () => {
    history.replaceState(null, '', '/tienda/tienda-1/producto/9?ref=compartir');

    service.setPage('Producto');

    const canonical = doc.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    expect(canonical?.getAttribute('href')).toMatch(/\/tienda\/tienda-1\/producto\/9$/);
    expect(canonical?.getAttribute('href')).not.toContain('?');
  });

  it('debe aceptar una ruta explícita para el canonical', () => {
    service.setPage('Planes', undefined, '/planes?plan=pro');

    const canonical = doc.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    expect(canonical?.getAttribute('href')).toMatch(/\/planes\?plan=pro$/);
  });

  it('debe publicar la imagen del producto como URL absoluta en Open Graph y Twitter', () => {
    service.setProductPage('Monitor', 'Un monitor', 300, { imageUrl: '/monitor.jpg' });

    expect(meta.getTag('property="og:image"')?.content).toMatch(/^https?:\/\/.+\/monitor\.jpg$/);
    expect(meta.getTag('property="og:image:alt"')?.content).toBe('Monitor');
    expect(meta.getTag('name="twitter:card"')?.content).toBe('summary_large_image');
    expect(meta.getTag('name="twitter:image"')?.content).toMatch(/\/monitor\.jpg$/);
  });

  it('debe omitir la imagen social cuando el producto no tiene imagen', () => {
    service.setProductPage('Monitor', 'Un monitor', 300);

    expect(meta.getTag('property="og:image"')).toBeNull();
    expect(meta.getTag('name="twitter:card"')?.content).toBe('summary');
  });

  it('debe publicar datos estructurados Product con precio y disponibilidad', () => {
    service.setProductPage('Monitor', 'Un monitor', 300, {
      imageUrl: '/monitor.jpg',
      inStock: false,
    });

    const script = doc.getElementById('seo-product-jsonld') as HTMLScriptElement;
    const data = JSON.parse(script.textContent ?? '{}');

    expect(data['@type']).toBe('Product');
    expect(data.name).toBe('Monitor');
    expect(data.offers.price).toBe(300);
    expect(data.offers.priceCurrency).toBe('NIO');
    expect(data.offers.availability).toBe('https://schema.org/OutOfStock');
    expect(data.image[0]).toMatch(/\/monitor\.jpg$/);
  });

  it('debe reutilizar el bloque JSON-LD y marcarlo disponible por defecto', () => {
    service.setProductPage('Uno', 'Primero', 1);
    service.setProductPage('Dos', 'Segundo', 2);

    const scripts = doc.querySelectorAll('script#seo-product-jsonld');
    const data = JSON.parse(scripts[0]?.textContent ?? '{}');

    expect(scripts).toHaveLength(1);
    expect(data.name).toBe('Dos');
    expect(data.offers.availability).toBe('https://schema.org/InStock');
  });

  it('debe restaurar Open Graph por defecto y limpiar canonical y JSON-LD al salir', () => {
    service.setProductPage('Monitor', 'Un monitor', 300, { imageUrl: '/monitor.jpg' });

    service.reset();

    expect(meta.getTag('property="og:title"')?.content).toBe('Quantum Store — Hardware Premium');
    expect(meta.getTag('property="og:image"')?.content).toMatch(/\/og-image\.png$/);
    expect(meta.getTag('name="twitter:card"')?.content).toBe('summary_large_image');
    expect(doc.head.querySelector('link[rel="canonical"]')).toBeNull();
    expect(doc.getElementById('seo-product-jsonld')).toBeNull();
  });
});
