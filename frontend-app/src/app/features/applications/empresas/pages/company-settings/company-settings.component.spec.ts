import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import CompanySettingsComponent from './company-settings.component';
import { AuthStore } from '../../../auth/public-api';
import { CompanyStore } from '../../state/company/company.store';
import { CompanyLogoStore } from '../../state/company-logo/company-logo.store';
import { SeoService } from '../../../../../core/services/seo/seo.service';
import { Company, LogisticsMode } from '../../models/company.model';

const company: Company = {
  id: 'c-1',
  name: 'Mi Empresa',
  slug: 'mi-empresa',
  logisticsMode: 'plataforma',
  type: 'comercial',
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
  const uploadingLogo = signal(false);
  const error = signal<string | null>(null);

  const companyStore = {
    company: companySignal.asReadonly(),
    loading: loading.asReadonly(),
    saving: saving.asReadonly(),
    error: error.asReadonly(),
    hasCompany: computed(() => companySignal() !== null),
    load: vi.fn(),
    create: vi.fn(),
    updateProfile: vi.fn(),
    updateSlug: vi.fn(),
    updateType: vi.fn(),
    updateLogistics: vi.fn(),
    createSeller: vi.fn(),
    applyCompanyUpdate: vi.fn(),
    clearError: vi.fn(),
    reset: vi.fn(),
  };

  const logoStore = {
    uploading: uploadingLogo.asReadonly(),
    upload: vi.fn(),
    clearError: vi.fn(),
    reset: vi.fn(),
  };

  const authStore = { user: user.asReadonly() };
  const seo = { setPage: vi.fn(), updateTitle: vi.fn(), reset: vi.fn() };

  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [CompanySettingsComponent],
      providers: [
        provideRouter([]),
        { provide: CompanyStore, useValue: companyStore },
        { provide: AuthStore, useValue: authStore },
        { provide: SeoService, useValue: seo },
      ],
    })
      .overrideComponent(CompanySettingsComponent, {
        set: { providers: [{ provide: CompanyLogoStore, useValue: logoStore }] },
      })
      .compileComponents();
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
    uploadingLogo.set(false);
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

  it('debe crear la empresa con el nombre, el slug y la modalidad elegidos', async () => {
    user.set({ id: 'u-1', name: 'Eva', email: 'eva@tienda.test', role: 'empresario' });
    const fixture = await setup();

    fixture.componentInstance.createCompanyForm.patchValue({
      name: 'Mi Empresa',
      slug: 'mi-empresa',
      logisticsMode: 'hibrida' as LogisticsMode,
    });
    fixture.componentInstance.submitCompany();

    expect(companyStore.create).toHaveBeenCalledWith({
      name: 'Mi Empresa',
      slug: 'mi-empresa',
      logisticsMode: 'hibrida',
      type: 'comercial',
      country: 'Nicaragua',
      currency: 'NIO',
    });
  });

  it('debe subir el logo elegido al crear la empresa', async () => {
    user.set({ id: 'u-1', name: 'Eva', email: 'eva@tienda.test', role: 'empresario' });
    const fixture = await setup();
    const file = new File(['logo'], 'logo.png', { type: 'image/png' });

    expect(fixture.nativeElement.querySelector('[data-testid="image-dropzone"]')).not.toBeNull();

    fixture.componentInstance.onCreateLogoSelected(file);
    companySignal.set(company);
    fixture.detectChanges();

    expect(logoStore.upload).toHaveBeenCalledWith(file);
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

  it('debe guardar el perfil comercial y fiscal', async () => {
    user.set({
      id: 'u-1',
      name: 'Eva',
      email: 'eva@tienda.test',
      role: 'empresario',
      tenantId: 'c-1',
    });
    companySignal.set(company);
    const fixture = await setup();

    fixture.componentInstance.profileForm.patchValue({
      legalName: 'Mi Empresa S.A.',
      commercialName: 'Mi Store',
      taxId: 'J0310000000000',
      contactEmail: 'hola@empresa.test',
      city: 'Managua',
    });
    fixture.componentInstance.submitProfile();

    expect(companyStore.updateProfile).toHaveBeenCalledWith({
      legalName: 'Mi Empresa S.A.',
      commercialName: 'Mi Store',
      taxId: 'J0310000000000',
      description: '',
      phone: '',
      contactEmail: 'hola@empresa.test',
      website: '',
      address: '',
      city: 'Managua',
      department: '',
      country: 'Nicaragua',
      currency: 'NIO',
      timezone: 'America/Managua',
      sector: '',
      legalRepresentative: '',
      businessHours: '',
    });
  });

  it('debe subir el logo elegido al almacenamiento del tenant', async () => {
    user.set({
      id: 'u-1',
      name: 'Eva',
      email: 'eva@tienda.test',
      role: 'empresario',
      tenantId: 'c-1',
    });
    companySignal.set(company);
    const fixture = await setup();
    const file = new File(['logo'], 'logo.png', { type: 'image/png' });

    fixture.componentInstance.onLogoSelected(file);

    expect(logoStore.upload).toHaveBeenCalledWith(file);
  });

  it('debe quitar el logo actual', async () => {
    user.set({
      id: 'u-1',
      name: 'Eva',
      email: 'eva@tienda.test',
      role: 'empresario',
      tenantId: 'c-1',
    });
    companySignal.set(company);
    const fixture = await setup();

    fixture.componentInstance.removeLogo();

    expect(companyStore.updateProfile).toHaveBeenCalledWith({ logoObjectId: null });
  });

  it('no debe subir ni quitar el logo a un rol que no es empresario', async () => {
    user.set({
      id: 'u-2',
      name: 'Vera',
      email: 'vera@tienda.test',
      role: 'vendedor',
      tenantId: 'c-1',
    });
    companySignal.set(company);
    const fixture = await setup();
    const file = new File(['logo'], 'logo.png', { type: 'image/png' });

    fixture.componentInstance.onLogoSelected(file);
    fixture.componentInstance.removeLogo();

    expect(logoStore.upload).not.toHaveBeenCalled();
    expect(companyStore.updateProfile).not.toHaveBeenCalled();
  });

  it('debe cambiar el slug público normalizado a minúsculas', async () => {
    user.set({
      id: 'u-1',
      name: 'Eva',
      email: 'eva@tienda.test',
      role: 'empresario',
      tenantId: 'c-1',
    });
    companySignal.set(company);
    const fixture = await setup();

    fixture.componentInstance.slugForm.setValue({ slug: 'Mi-Nuevo-Slug' });
    fixture.componentInstance.submitSlug();

    expect(companyStore.updateSlug).toHaveBeenCalledWith('mi-nuevo-slug');
  });

  it('debe cambiar el tipo de empresa', async () => {
    user.set({
      id: 'u-1',
      name: 'Eva',
      email: 'eva@tienda.test',
      role: 'empresario',
      tenantId: 'c-1',
    });
    companySignal.set(company);
    const fixture = await setup();

    fixture.componentInstance.typeForm.setValue({ companyType: 'logistica' });
    fixture.componentInstance.submitType();

    expect(companyStore.updateType).toHaveBeenCalledWith('logistica');
  });

  it('debe mostrar el tipo y el slug en el resumen', async () => {
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
      fixture.nativeElement.querySelector('[data-testid="company-type"]').textContent,
    ).toContain('Comercial');
    expect(
      fixture.nativeElement.querySelector('[data-testid="company-slug"]').textContent,
    ).toContain('mi-empresa');
  });

  it('no debe guardar el perfil, slug ni tipo a un rol que no es empresario', async () => {
    user.set({
      id: 'u-2',
      name: 'Vera',
      email: 'vera@tienda.test',
      role: 'vendedor',
      tenantId: 'c-1',
    });
    companySignal.set(company);
    const fixture = await setup();

    fixture.componentInstance.submitProfile();
    fixture.componentInstance.submitSlug();
    fixture.componentInstance.submitType();

    expect(companyStore.updateProfile).not.toHaveBeenCalled();
    expect(companyStore.updateSlug).not.toHaveBeenCalled();
    expect(companyStore.updateType).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('[data-testid="profile-form"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid="slug-form"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid="type-form"]')).toBeNull();
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
