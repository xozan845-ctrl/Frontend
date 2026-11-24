import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { Footer } from './footer.component';
import { PRODUCT_REPOSITORY } from '../../features/domains/storefront/public-api';

const productRepoStub = { getStorefront: () => of({ store: null, products: [] }) };

describe('Footer', () => {
  let component: Footer;
  let fixture: ComponentFixture<Footer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Footer],
      providers: [provideRouter([]), { provide: PRODUCT_REPOSITORY, useValue: productRepoStub }],
    }).compileComponents();

    fixture = TestBed.createComponent(Footer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('debe volver arriba sin handler inline (R-SE-9)', () => {
    const scrollSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    const button = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '[aria-label="Volver arriba"]',
    );

    button?.click();

    expect(scrollSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    scrollSpy.mockRestore();
  });

  it('debe renderizar solo la identidad, contacto y políticas recibidas', async () => {
    fixture.componentRef.setInput('companyInfo', {
      name: 'Tienda A',
      description: 'Descripción A',
      email: 'hola@a.test',
      displayPhone: '111',
      socials: { instagram: 'https://instagram.com/a' },
      policies: [{ label: 'Privacidad A', url: '/privacidad-a' }],
      newsletter: { title: 'Boletín A', description: 'Novedades A' },
    });
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.textContent).toContain('Tienda A');
    expect(host.querySelector('[data-testid="footer-description"]')?.textContent).toContain(
      'Descripción A',
    );
    expect(host.querySelector('[data-testid="footer-contact"]')?.textContent).toContain(
      'hola@a.test',
    );
    expect(host.querySelector('[data-testid="footer-policies"]')?.textContent).toContain(
      'Privacidad A',
    );
    expect(host.querySelector('[data-testid="footer-newsletter"]')?.textContent).toContain(
      'Boletín A',
    );
    expect(host.querySelector('[aria-label="Instagram"]')?.getAttribute('href')).toBe(
      'https://instagram.com/a',
    );
  });

  it('debe ocultar los datos del contexto anterior al recibir uno con campos omitidos', async () => {
    fixture.componentRef.setInput('companyInfo', {
      name: 'Tienda A',
      email: 'hola@a.test',
      phone: '111',
      socials: { twitter: 'https://x.com/a' },
      policies: [{ label: 'Devoluciones A', url: '/devoluciones-a' }],
      newsletter: { title: 'Boletín A' },
    });
    fixture.detectChanges();

    fixture.componentRef.setInput('companyInfo', { name: 'Tienda B' });
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.textContent).toContain('Tienda B');
    expect(host.textContent).not.toContain('Tienda A');
    expect(host.textContent).not.toContain('hola@a.test');
    expect(host.querySelector('[data-testid="footer-contact"]')).toBeNull();
    expect(host.querySelector('[data-testid="footer-socials"]')).toBeNull();
    expect(host.querySelector('[data-testid="footer-policies"]')).toBeNull();
    expect(host.querySelector('[data-testid="footer-newsletter"]')).toBeNull();
  });
});
