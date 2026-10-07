import { TestBed } from '@angular/core/testing';
import { StoreConfigService } from './store-config.service';
import { COMPANY_INFO } from '../constants/company.constants';

describe('StoreConfigService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('debe iniciar con la configuración por defecto', () => {
    const service = TestBed.inject(StoreConfigService);

    expect(service.companyInfo()).toEqual(COMPANY_INFO);
  });

  it('debe actualizar campos parciales preservando el resto', () => {
    const service = TestBed.inject(StoreConfigService);

    service.updateConfig({ name: 'Nueva Tienda' });

    expect(service.companyInfo().name).toBe('Nueva Tienda');
    expect(service.companyInfo().email).toBe(COMPANY_INFO.email);
  });

  it('debe fusionar los socials sin perder los existentes', () => {
    const service = TestBed.inject(StoreConfigService);

    service.updateConfig({ socials: { twitter: 'https://x.com' } });

    expect(service.companyInfo().socials.twitter).toBe('https://x.com');
    expect(service.companyInfo().socials.instagram).toBe(COMPANY_INFO.socials.instagram);
  });
});
