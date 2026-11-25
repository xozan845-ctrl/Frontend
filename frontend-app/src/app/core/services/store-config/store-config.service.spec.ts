import { TestBed } from '@angular/core/testing';
import { CURRENCY } from '../../config/currency.config';
import { StoreConfigService } from './store-config.service';

describe('StoreConfigService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('debe iniciar con identidad neutra sin marca ni promesas', () => {
    const service = TestBed.inject(StoreConfigService);
    const config = service.companyInfo();

    expect(config.name).toBeUndefined();
    expect(config.email).toBeUndefined();
    expect(config.phone).toBeUndefined();
    expect(config.socials).toEqual({});
    expect(config.benefits).toEqual([]);
    expect(config.policies).toEqual([]);
    expect(service.currency()).toEqual(CURRENCY);
  });

  it('no debe inferir canales de soporte de un contacto genérico', () => {
    const service = TestBed.inject(StoreConfigService);

    service.setContext('tienda-a', {
      email: 'hola@a.test',
      phone: '111222333',
      whatsappMessage: 'Hola A',
    });

    expect(service.companyInfo().email).toBe('hola@a.test');
    expect(service.support()).toBeUndefined();
  });

  it('debe cargar la configuración del contexto recibido', () => {
    const service = TestBed.inject(StoreConfigService);

    service.setContext('tienda-a', {
      name: 'Tienda A',
      email: 'hola@a.test',
      phone: '111',
      currency: { code: 'USD', locale: 'en-US' },
      socials: { instagram: 'https://instagram.com/a' },
      benefits: [{ icon: 'fa-lock', title: 'Pago protegido' }],
      policies: [{ label: 'Privacidad', url: '/privacidad-a' }],
      support: { label: 'Ayuda A', responseTime: '1 h' },
    });

    expect(service.contextId()).toBe('tienda-a');
    expect(service.companyInfo().name).toBe('Tienda A');
    expect(service.currency()).toEqual({ code: 'USD', locale: 'en-US' });
    expect(service.benefits()).toHaveLength(1);
    expect(service.policies()).toHaveLength(1);
    expect(service.support()?.label).toBe('Ayuda A');
  });

  it('debe descartar toda la configuración al cambiar de tienda con campos omitidos', () => {
    const service = TestBed.inject(StoreConfigService);
    service.setContext('tienda-a', {
      name: 'Tienda A',
      email: 'hola@a.test',
      phone: '111',
      socials: { twitter: 'https://x.com/a', instagram: 'https://instagram.com/a' },
      benefits: [{ icon: 'fa-truck', title: 'Envío A' }],
      policies: [{ label: 'Devoluciones A', url: '/devoluciones-a' }],
      support: { label: 'Soporte A' },
    });

    service.setContext('tienda-b', { name: 'Tienda B' });

    expect(service.contextId()).toBe('tienda-b');
    expect(service.companyInfo().name).toBe('Tienda B');
    expect(service.companyInfo().email).toBeUndefined();
    expect(service.companyInfo().phone).toBeUndefined();
    expect(service.companyInfo().socials).toEqual({});
    expect(service.benefits()).toEqual([]);
    expect(service.policies()).toEqual([]);
    expect(service.support()).toBeUndefined();
    expect(service.currency()).toEqual(CURRENCY);
  });

  it('debe volver a la identidad neutra al limpiar el contexto', () => {
    const service = TestBed.inject(StoreConfigService);
    service.setContext('tienda-a', { name: 'Tienda A', email: 'hola@a.test' });

    service.clear();

    expect(service.contextId()).toBeNull();
    expect(service.companyInfo().name).toBeUndefined();
    expect(service.companyInfo().email).toBeUndefined();
  });

  it('debe reemplazar el contexto con updateConfig en vez de fusionarlo', () => {
    const service = TestBed.inject(StoreConfigService);
    service.setContext('tienda-a', { name: 'Tienda A', email: 'hola@a.test' });

    service.updateConfig({ name: 'Otra A' });

    expect(service.companyInfo().name).toBe('Otra A');
    expect(service.companyInfo().email).toBeUndefined();
  });

  it('debe ocultar valores vacíos y beneficios sin título', () => {
    const service = TestBed.inject(StoreConfigService);

    service.setContext('tienda-a', {
      name: '  ',
      email: '',
      socials: { twitter: '', instagram: 'https://instagram.com/a' },
      benefits: [
        { icon: 'fa-lock', title: '' },
        { icon: 'fa-shield', title: 'Pago seguro', subtitle: '  ' },
      ],
    });

    expect(service.companyInfo().name).toBeUndefined();
    expect(service.companyInfo().email).toBeUndefined();
    expect(service.companyInfo().socials).toEqual({ instagram: 'https://instagram.com/a' });
    expect(service.benefits()).toEqual([
      { icon: 'fa-shield', title: 'Pago seguro', subtitle: undefined },
    ]);
  });
});
