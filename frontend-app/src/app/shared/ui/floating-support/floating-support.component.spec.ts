import { TestBed } from '@angular/core/testing';
import { FloatingSupportComponent } from './floating-support.component';

describe('FloatingSupportComponent', () => {
  const setup = () => {
    TestBed.configureTestingModule({ imports: [FloatingSupportComponent] });
    const fixture = TestBed.createComponent(FloatingSupportComponent);
    fixture.detectChanges();
    return fixture;
  };

  afterEach(() => vi.restoreAllMocks());

  it('debe abrir y cerrar el panel de soporte', () => {
    const fixture = setup();
    const toggle = (fixture.nativeElement as HTMLElement).querySelector(
      '[aria-label="Abrir soporte y contacto directo"]',
    ) as HTMLButtonElement;

    toggle.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.isOpen()).toBe(true);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      '¿En qué podemos ayudarte?',
    );

    (fixture.nativeElement as HTMLElement)
      .querySelector('[aria-label="Cerrar soporte"]')!
      .dispatchEvent(new Event('click'));
    fixture.detectChanges();

    expect(fixture.componentInstance.isOpen()).toBe(false);
  });

  it('debe abrir WhatsApp con un enlace seguro en nueva pestaña', () => {
    const fixture = setup();
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);

    fixture.componentInstance.openWhatsApp();

    expect(open).toHaveBeenCalledWith(
      expect.stringContaining('https://wa.me/'),
      '_blank',
      'noopener,noreferrer',
    );
  });
});
