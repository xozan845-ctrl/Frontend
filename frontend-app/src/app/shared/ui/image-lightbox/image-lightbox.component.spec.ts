import { TestBed } from '@angular/core/testing';
import { ImageLightboxComponent } from './image-lightbox.component';

describe('ImageLightboxComponent', () => {
  const setup = () => {
    TestBed.configureTestingModule({ imports: [ImageLightboxComponent] });
    const fixture = TestBed.createComponent(ImageLightboxComponent);
    fixture.componentRef.setInput('imageUrl', '/foto.jpg');
    fixture.componentRef.setInput('imageAlt', 'Foto del producto');
    fixture.detectChanges();
    return fixture;
  };

  afterEach(() => {
    document.body.style.overflow = '';
  });

  it('no debe renderizar la imagen mientras está cerrado', () => {
    const fixture = setup();

    expect((fixture.nativeElement as HTMLElement).querySelector('img')).toBeNull();
  });

  it('debe abrir la imagen ampliada y bloquear el scroll', () => {
    const fixture = setup();
    fixture.componentInstance.open();
    fixture.detectChanges();
    const image = (fixture.nativeElement as HTMLElement).querySelector('img') as HTMLImageElement;

    expect(image).not.toBeNull();
    expect(image.getAttribute('src')).toBe('/foto.jpg');
    expect(image.getAttribute('alt')).toBe('Foto del producto');
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('debe cerrar al pulsar el botón de cierre', () => {
    const fixture = setup();
    fixture.componentInstance.open();
    fixture.detectChanges();

    (fixture.nativeElement as HTMLElement)
      .querySelector('[aria-label="Cerrar vista ampliada"]')!
      .dispatchEvent(new Event('click'));
    fixture.detectChanges();

    expect(fixture.componentInstance.isOpen()).toBe(false);
    expect(document.body.style.overflow).toBe('');
  });

  it('debe cerrar con Escape cuando está abierto', () => {
    const fixture = setup();
    fixture.componentInstance.open();
    fixture.detectChanges();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();

    expect(fixture.componentInstance.isOpen()).toBe(false);
  });
});
