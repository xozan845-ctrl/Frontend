import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import CompanySettingsComponent from './company-settings.component';
import { AuthStore } from '../../../auth/public-api';
import { CompanyStore } from '../../state/company/company.store';
import { SeoService } from '../../../../../core/services/seo/seo.service';
import { Company, LogisticsMode } from '../../models/company.model';

const company: Company = {
  id: 'c-1',
  name: 'Mi Empresa',
  logisticsMode: 'plataforma',
  status: 'activa',
  createdBy: 'u-1',
  createdAt: '2026-10-21T00:00:00.000Z',
};

describe('CompanySettingsComponent', () => {
  const user = signal<{
    id: string;
    name: string;
    email: string;
    role: string;
    tenantId?: string;
  } | null>(null);
  const companySignal = signal<Company | null>(null);
  const loading = signal(false);
  const saving = signal(false);
  const error = signal<string | null>(null);

  const companyStore = {
    company: companySignal.asReadonly(),
    loading: loading.asReadonly(),
    saving: saving.asReadonly(),
    error: error.asReadonly(),
    hasCompany: computed(() => companySignal() !== null),
    load: vi.fn(),
    create: vi.fn(),
    updateLogistics: vi.fn(),
    createSeller: vi.fn(),
    clearError: vi.fn(),
    reset: vi.fn(),
  };

  const authStore = { user: user.asReadonly() };
  const seo = { setPage: vi.fn(), reset: vi.fn() };

  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [CompanySettingsComponent],
      providers: [
        provideRouter([]),
        { provide: CompanyStore, useValue: companyStore },
        { provide: AuthStore, useValue: authStore },
        { provide: SeoService, useValue: seo },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(CompanySettingsComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    user.set(null);
    companySignal.set(null);
    loading.set(false);
    saving.set(false);
    error.set(null);
    TestBed.resetTestingModule();
  });

  it('debe mostrar el formulario de alta al empresario sin empresa', async () => {
    user.set({
      id: 'u-1',
      name: 'Eva',
      email: 'eva@tienda.test',
      role: 'empresario',
    });
    const fixture = await setup();

    expect(
      fixture.nativeElement.querySelector('[data-testid="create-company-form"]'),
    ).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid="company-card"]')).toBeNull();
  });

  it('debe crear la empresa con el nombre y la modalidad elegidos', async () => {
    user.set({ id: 'u-1', name: 'Eva', email: 'eva@tienda.test', role: 'empresario' });
    const fixture = await setup();

    fixture.componentInstance.createCompanyForm.setValue({
      name: 'Mi Empresa',
      logisticsMode: 'hibrida' as LogisticsMode,
    });
    fixture.componentInstance.submitCompany();

    expect(companyStore.create).toHaveBeenCalledWith({
      name: 'Mi Empresa',
      logisticsMode: 'hibrida',
    });
  });

  it('no debe crear la empresa si el formulario es inválido', async () => {
    user.set({ id: 'u-1', name: 'Eva', email: 'eva@tienda.test', role: 'empresario' });
    const fixture = await setup();

    fixture.componentInstance.createCompanyForm.controls.name.setValue('X');
    fixture.componentInstance.submitCompany();

    expect(companyStore.create).not.toHaveBeenCalled();
  });

  it('debe mostrar el aviso de empresa no disponible a un vendedor', async () => {
    user.set({ id: 'u-2', name: 'Vera', email: 'vera@tienda.test', role: 'vendedor' });
    const fixture = await setup();

    expect(
      fixture.nativeElement.querySelector('[data-testid="company-unavailable"]'),
    ).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid="create-company-form"]')).toBeNull();
  });

  it('debe cargar la empresa del tenant al entrar', async () => {
    user.set({
      id: 'u-1',
      name: 'Eva',
      email: 'eva@tienda.test',
      role: 'empresario',
      tenantId: 'c-1',
    });

    await setup();

    expect(companyStore.load).toHaveBeenCalledWith('c-1');
  });

  it('debe mostrar la empresa y guardar la modalidad logística', async () => {
    user.set({
      id: 'u-1',
      name: 'Eva',
      email: 'eva@tienda.test',
      role: 'empresario',
      tenantId: 'c-1',
    });
    companySignal.set(company);
    const fixture = await setup();

    expect(fixture.nativeElement.textContent).toContain('Mi Empresa');
    expect(
      fixture.nativeElement.querySelector('[data-testid="company-logistics-mode"]').textContent,
    ).toContain('Plataforma');

    fixture.componentInstance.logisticsForm.setValue({ logisticsMode: 'propia' });
    fixture.componentInstance.submitLogistics();

    expect(companyStore.updateLogistics).toHaveBeenCalledWith('propia');
  });

  it('no debe guardar la logística a un rol que no es empresario', async () => {
    user.set({
      id: 'u-2',
      name: 'Vera',
      email: 'vera@tienda.test',
      role: 'vendedor',
      tenantId: 'c-1',
    });
    companySignal.set(company);
    const fixture = await setup();

    fixture.componentInstance.submitLogistics();

    expect(companyStore.updateLogistics).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('[data-testid="logistics-form"]')).toBeNull();
  });

  it('debe enlazar al módulo dedicado de vendedores', async () => {
    user.set({
      id: 'u-1',
      name: 'Eva',
      email: 'eva@tienda.test',
      role: 'empresario',
      tenantId: 'c-1',
    });
    companySignal.set(company);
    const fixture = await setup();

    expect(
      fixture.nativeElement.querySelector('[data-testid="manage-company-sellers"]'),
    ).not.toBeNull();
  });

  it('debe mostrar el estado de carga', async () => {
    loading.set(true);
    const fixture = await setup();

    expect(fixture.nativeElement.querySelector('[data-testid="company-loading"]')).not.toBeNull();
  });

  it('debe mostrar el error y reintentar la carga', async () => {
    user.set({
      id: 'u-1',
      name: 'Eva',
      email: 'eva@tienda.test',
      role: 'empresario',
      tenantId: 'c-1',
    });
    error.set('No se pudo cargar la empresa.');
    const fixture = await setup();

    expect(
      fixture.nativeElement.querySelector('[data-testid="company-error"]').textContent,
    ).toContain('No se pudo cargar la empresa.');

    fixture.componentInstance.retry();

    expect(companyStore.load).toHaveBeenCalledWith('c-1');
  });
});
