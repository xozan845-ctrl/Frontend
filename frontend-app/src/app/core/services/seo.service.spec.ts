import { TestBed } from '@angular/core/testing';
import { Meta, Title } from '@angular/platform-browser';
import { SeoService } from './seo.service';

describe('SeoService', () => {
  let service: SeoService;
  let title: Title;
  let meta: Meta;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [SeoService, Title, Meta] });
    service = TestBed.inject(SeoService);
    title = TestBed.inject(Title);
    meta = TestBed.inject(Meta);
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

  it('debe configurar una página genérica con título y descripción', () => {
    service.setPage('Planes', 'Elige tu membresía');

    expect(title.getTitle()).toBe('Planes | Quantum Store');
    expect(meta.getTag('name="description"')?.content).toBe('Elige tu membresía');
  });
});
