import { TestBed } from '@angular/core/testing';
import type { CompanyInfo } from '../../../core/models/company.model';
import { FloatingSupportComponent } from './floating-support.component';

describe('FloatingSupportComponent', () => {
  const setup = (companyInfo?: CompanyInfo) => {
    TestBed.configureTestingModule({ imports: [FloatingSupportComponent] });
    const fixture = TestBed.createComponent(FloatingSupportComponent);
    if (companyInfo) fixture.componentRef.setInput('companyInfo', companyInfo);
    fixture.detectChanges();
    return fixture;
  };

  afterEach(() => vi.restoreAllMocks());

  it('debe abrir y cerrar el panel de soporte', () => {
    const fixture = setup({
      name: 'Tienda A',
      support: { label: 'Soporte A', email: 'hola@a.test', whatsappPhone: '111222333' },
    });
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

  it('debe abrir WhatsApp con el canal recibido y un enlace seguro', () => {
    const fixture = setup();
    fixture.componentRef.setInput('companyInfo', {
      name: 'Tienda A',
      support: { whatsappPhone: '111222333', whatsappMessage: 'Hola A' },
    });
    fixture.detectChanges();
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);

    fixture.componentInstance.openWhatsApp();

    expect(open).toHaveBeenCalledWith(
      expect.stringContaining('https://wa.me/111222333'),
      '_blank',
      'noopener,noreferrer',
    );
  });

  it('no debe mostrar el widget cuando no hay canales confirmados', () => {
    const fixture = setup({
      name: 'Tienda B',
      phone: '111222333',
      email: 'hola@b.test',
      whatsappMessage: 'Hola B',
    });
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('button')).toBeNull();
    expect(host.textContent).toBe('');
    expect(host.textContent).not.toContain('Soporte Quantum');
    expect(host.textContent).not.toContain('Respuesta promedio: 2 min');
    expect(host.textContent).not.toContain('Garantía y devoluciones 30 días garantizados');
  });

  it('debe ocultar el widget al pasar a un contexto sin canales', () => {
    const fixture = setup({
      name: 'Tienda A',
      support: { email: 'hola@a.test' },
    });
    expect((fixture.nativeElement as HTMLElement).querySelector('button')).toBeTruthy();

    fixture.componentRef.setInput('companyInfo', { name: 'Tienda B' });
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('button')).toBeNull();
  });
});
