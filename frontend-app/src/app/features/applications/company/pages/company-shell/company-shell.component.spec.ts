import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import CompanyShellComponent from './company-shell.component';
import { AuthStore } from '../../../auth/public-api';
import { BrandingService } from '../../../../../core/services/branding/branding.service';
import { CompanyStore } from '../../state/company/company.store';
import type { Company } from '../../models/company.model';

describe('CompanyShellComponent', () => {
  const companySignal = signal<Company | null>(null);
  const companyStore = {
    company: companySignal.asReadonly(),
    load: vi.fn(),
  };
  const branding = { setLogo: vi.fn(), reset: vi.fn() };

  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [CompanyShellComponent],
      providers: [
        provideRouter([]),
        { provide: AuthStore, useValue: { user: signal(null) } },
        { provide: CompanyStore, useValue: companyStore },
        { provide: BrandingService, useValue: branding },
      ],
    })
      .overrideComponent(CompanyShellComponent, { set: { providers: [] } })
      .compileComponents();
    const fixture = TestBed.createComponent(CompanyShellComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    companySignal.set(null);
    TestBed.resetTestingModule();
  });

  it('abre el drawer móvil y lo cierra con Escape', async () => {
    const fixture = await setup();
    const toggle = fixture.nativeElement.querySelector(
      '[data-testid="company-sidebar-toggle"]',
    ) as HTMLButtonElement;

    toggle.click();
    expect(fixture.componentInstance.isSidebarOpen()).toBe(true);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(fixture.componentInstance.isSidebarOpen()).toBe(false);
  });

  it('aplica el logo de la empresa a la pestaña', async () => {
    companySignal.set({
      id: 'c-1',
      name: 'Mi Empresa',
      logisticsMode: 'plataforma',
      type: 'comercial',
      status: 'activa',
      createdBy: 'u-1',
      createdAt: '2026-10-21T00:00:00.000Z',
      logoUrl: 'https://cdn.test/logo.png',
    });
    await setup();

    expect(branding.setLogo).toHaveBeenCalledWith('https://cdn.test/logo.png');
  });

  it('restaura el icono al salir del workspace', async () => {
    const fixture = await setup();
    fixture.destroy();

    expect(branding.reset).toHaveBeenCalled();
  });
});
