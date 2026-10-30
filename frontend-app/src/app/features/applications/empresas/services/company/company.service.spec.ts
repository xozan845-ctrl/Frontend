import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CompanyService } from './company.service';
import { Company, CompanySeller } from '../../models/company.model';
import { environment } from '../../../../../../environments/environment';

describe('CompanyService', () => {
  let service: CompanyService;
  let httpMock: HttpTestingController;

  const originalApiUrl = environment.apiUrl;
  const originalDataSource = environment.apiConfig.dataSource;

  const build = () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CompanyService);
    httpMock = TestBed.inject(HttpTestingController);
  };

  beforeEach(() => TestBed.resetTestingModule());

  afterEach(() => {
    environment.apiUrl = originalApiUrl;
    environment.apiConfig.dataSource = originalDataSource;
  });

  it('debe crear la empresa con el payload del contrato', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let result: Company | undefined;

    service
      .create({ name: 'Mi Empresa', logisticsMode: 'hibrida' })
      .subscribe((company) => (result = company));

    const request = httpMock.expectOne('https://api.test/empresas');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      nombre: 'Mi Empresa',
      modalidad_logistica: 'hibrida',
    });
    request.flush({
      id: 'c-1',
      nombre: 'Mi Empresa',
      modalidad_logistica: 'hibrida',
      estado: 'activa',
      creado_por: 'u-1',
      creado_en: '2026-10-21T00:00:00.000Z',
    });

    expect(result?.name).toBe('Mi Empresa');
    expect(result?.logisticsMode).toBe('hibrida');
  });

  it('debe obtener la empresa por id', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let result: Company | undefined;

    service.getById('c-1').subscribe((company) => (result = company));

    const request = httpMock.expectOne('https://api.test/empresas/c-1');
    expect(request.request.method).toBe('GET');
    request.flush({ id: 'c-1', nombre: 'Mi Empresa', modalidad_logistica: 'propia' });

    expect(result?.id).toBe('c-1');
    expect(result?.logisticsMode).toBe('propia');
  });

  it('debe actualizar la modalidad logística', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let result: Company | undefined;

    service.updateLogistics('c-1', 'hibrida').subscribe((company) => (result = company));

    const request = httpMock.expectOne('https://api.test/empresas/c-1/logistica');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ modalidad_logistica: 'hibrida' });
    request.flush({ id: 'c-1', nombre: 'Mi Empresa', modalidad_logistica: 'hibrida' });

    expect(result?.logisticsMode).toBe('hibrida');
  });

  it('debe crear un vendedor con participación', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let result: CompanySeller | undefined;

    service
      .createSeller('c-1', {
        name: 'Vera',
        email: 'vera@tienda.test',
        password: 'secreto123',
        participationPercentage: 25,
      })
      .subscribe((seller) => (result = seller));

    const request = httpMock.expectOne('https://api.test/empresas/c-1/vendedores');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      nombre: 'Vera',
      correo: 'vera@tienda.test',
      contrasena: 'secreto123',
      participacion_porcentaje: 25,
    });
    request.flush({
      id: 's-1',
      nombre: 'Vera',
      correo: 'vera@tienda.test',
      rol: 'vendedor',
      participacion_porcentaje: 25,
    });

    expect(result?.name).toBe('Vera');
    expect(result?.participationPercentage).toBe(25);
  });

  it('debe crear la empresa con slug y metadatos, omitiendo vacíos', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let result: Company | undefined;

    service
      .create({
        name: 'Mi Empresa',
        slug: 'mi-empresa',
        logisticsMode: 'hibrida',
        type: 'logistica',
        legalName: 'Mi Empresa S.A.',
        taxId: 'J0310000000000',
        city: '',
        logoObjectId: '3f1c0a8e-7d2b-4c6a-9f10-2b8d5e4a7c01',
      })
      .subscribe((company) => (result = company));

    const request = httpMock.expectOne('https://api.test/empresas');
    expect(request.request.body).toEqual({
      nombre: 'Mi Empresa',
      modalidad_logistica: 'hibrida',
      tipo_empresa: 'logistica',
      slug: 'mi-empresa',
      razon_social: 'Mi Empresa S.A.',
      ruc: 'J0310000000000',
      logo_objeto_id: '3f1c0a8e-7d2b-4c6a-9f10-2b8d5e4a7c01',
    });
    request.flush({
      id: 'c-1',
      nombre: 'Mi Empresa',
      slug: 'mi-empresa',
      modalidad_logistica: 'hibrida',
      tipo_empresa: 'logistica',
    });

    expect(result?.slug).toBe('mi-empresa');
    expect(result?.type).toBe('logistica');
  });

  it('debe actualizar el perfil comercial y fiscal', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let result: Company | undefined;

    service
      .updateProfile('c-1', {
        legalName: 'Mi Empresa S.A.',
        commercialName: 'Mi Store',
        taxId: 'J0310000000000',
        contactEmail: 'hola@empresa.test',
        city: 'Managua',
        currency: 'nio',
        logoObjectId: null,
      })
      .subscribe((company) => (result = company));

    const request = httpMock.expectOne('https://api.test/empresas/c-1/perfil');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({
      razon_social: 'Mi Empresa S.A.',
      nombre_comercial: 'Mi Store',
      ruc: 'J0310000000000',
      correo_contacto: 'hola@empresa.test',
      ciudad: 'Managua',
      moneda: 'nio',
      logo_objeto_id: null,
    });
    request.flush({ id: 'c-1', nombre: 'Mi Empresa', nombre_comercial: 'Mi Store' });

    expect(result?.commercialName).toBe('Mi Store');
  });

  it('debe actualizar el slug público', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let result: Company | undefined;

    service.updateSlug('c-1', 'nuevo-slug').subscribe((company) => (result = company));

    const request = httpMock.expectOne('https://api.test/empresas/c-1/slug');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ slug: 'nuevo-slug' });
    request.flush({ id: 'c-1', nombre: 'Mi Empresa', slug: 'nuevo-slug' });

    expect(result?.slug).toBe('nuevo-slug');
  });

  it('debe actualizar el tipo de empresa', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let result: Company | undefined;

    service.updateType('c-1', 'logistica').subscribe((company) => (result = company));

    const request = httpMock.expectOne('https://api.test/empresas/c-1/tipo');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ tipo_empresa: 'logistica' });
    request.flush({ id: 'c-1', nombre: 'Mi Empresa', tipo_empresa: 'logistica' });

    expect(result?.type).toBe('logistica');
  });

  it('debe traducir el error 404 al cargar la empresa', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let error: Error | undefined;

    service.getById('no-existe').subscribe({ error: (e: Error) => (error = e) });
    httpMock
      .expectOne('https://api.test/empresas/no-existe')
      .flush({ mensaje: 'Empresa no encontrada.' }, { status: 404, statusText: 'Not Found' });

    expect(error?.message).toBe('Empresa no encontrada.');
  });

  it('debe traducir el error al crear la empresa', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let error: Error | undefined;

    service.create({ name: 'X', logisticsMode: 'plataforma' }).subscribe({
      error: (e: Error) => (error = e),
    });
    httpMock
      .expectOne('https://api.test/empresas')
      .flush({}, { status: 500, statusText: 'Server Error' });

    expect(error?.message).toBe('No se pudo crear la empresa.');
  });

  it('debe traducir el error al actualizar la logística', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let error: Error | undefined;

    service.updateLogistics('c-1', 'propia').subscribe({ error: (e: Error) => (error = e) });
    httpMock
      .expectOne('https://api.test/empresas/c-1/logistica')
      .flush(
        { mensaje: 'Solo un empresario activo puede cambiar la logística.' },
        { status: 403, statusText: 'Forbidden' },
      );

    expect(error?.message).toBe('Solo un empresario activo puede cambiar la logística.');
  });

  it('debe traducir el error al actualizar el perfil', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let error: Error | undefined;

    service.updateProfile('c-1', { city: 'Managua' }).subscribe({
      error: (e: Error) => (error = e),
    });
    httpMock
      .expectOne('https://api.test/empresas/c-1/perfil')
      .flush({ mensaje: 'El logo no existe.' }, { status: 400, statusText: 'Bad Request' });

    expect(error?.message).toBe('El logo no existe.');
  });

  it('debe traducir el error al actualizar el slug', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let error: Error | undefined;

    service.updateSlug('c-1', 'ocupado').subscribe({ error: (e: Error) => (error = e) });
    httpMock
      .expectOne('https://api.test/empresas/c-1/slug')
      .flush({ mensaje: 'El slug ya está en uso.' }, { status: 409, statusText: 'Conflict' });

    expect(error?.message).toBe('El slug ya está en uso.');
  });

  it('debe traducir el error al actualizar el tipo', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let error: Error | undefined;

    service.updateType('c-1', 'plataforma').subscribe({ error: (e: Error) => (error = e) });
    httpMock
      .expectOne('https://api.test/empresas/c-1/tipo')
      .flush({}, { status: 500, statusText: 'Server Error' });

    expect(error?.message).toBe('No se pudo actualizar el tipo.');
  });

  it('debe traducir el error al crear el vendedor', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let error: Error | undefined;

    service
      .createSeller('c-1', {
        name: 'Vera',
        email: 'vera@tienda.test',
        password: 'secreto123',
        participationPercentage: 10,
      })
      .subscribe({ error: (e: Error) => (error = e) });
    httpMock
      .expectOne('https://api.test/empresas/c-1/vendedores')
      .flush({}, { status: 500, statusText: 'Server Error' });

    expect(error?.message).toBe('No se pudo crear el vendedor.');
  });

  describe('dataSource mock', () => {
    beforeEach(() => {
      environment.apiConfig.dataSource = 'mock';
    });

    it('debe crear una empresa en mock', async () => {
      build();
      let result: Company | undefined;

      service.create({ name: 'Mock', logisticsMode: 'propia' }).subscribe((c) => (result = c));
      await vi.waitFor(() => expect(result).toBeDefined(), { timeout: 2000 });

      expect(result?.name).toBe('Mock');
      expect(result?.logisticsMode).toBe('propia');
    });

    it('debe obtener, actualizar perfil, slug, tipo, logística y crear vendedor en mock', async () => {
      build();
      let company: Company | undefined;
      let profiled: Company | undefined;
      let slugged: Company | undefined;
      let typed: Company | undefined;
      let updated: Company | undefined;
      let seller: CompanySeller | undefined;

      service.getById('empresa-demo').subscribe((c) => (company = c));
      service
        .updateProfile('empresa-demo', { commercialName: 'Demo Store' })
        .subscribe((c) => (profiled = c));
      service.updateSlug('empresa-demo', 'demo-nuevo').subscribe((c) => (slugged = c));
      service.updateType('empresa-demo', 'logistica').subscribe((c) => (typed = c));
      service.updateLogistics('empresa-demo', 'hibrida').subscribe((c) => (updated = c));
      service
        .createSeller('empresa-demo', {
          name: 'Vera',
          email: 'vera@tienda.test',
          password: 'secreto123',
          participationPercentage: 15,
        })
        .subscribe((s) => (seller = s));

      await vi.waitFor(
        () => expect(company && profiled && slugged && typed && updated && seller).toBeTruthy(),
        {
          timeout: 2000,
        },
      );
      expect(profiled?.commercialName).toBe('Demo Store');
      expect(slugged?.slug).toBe('demo-nuevo');
      expect(typed?.type).toBe('logistica');
      expect(updated?.logisticsMode).toBe('hibrida');
      expect(seller?.name).toBe('Vera');
    });
  });

  describe('sin apiUrl configurada', () => {
    beforeEach(() => {
      environment.apiUrl = '';
    });

    it('debe fallar las operaciones sin apiUrl', () => {
      build();
      const errors: Error[] = [];

      service.create({ name: 'X', logisticsMode: 'plataforma' }).subscribe({
        error: (e: Error) => errors.push(e),
      });
      service.getById('c-1').subscribe({ error: (e: Error) => errors.push(e) });
      service.updateProfile('c-1', { city: 'Managua' }).subscribe({
        error: (e: Error) => errors.push(e),
      });
      service.updateSlug('c-1', 'slug').subscribe({ error: (e: Error) => errors.push(e) });
      service.updateType('c-1', 'comercial').subscribe({ error: (e: Error) => errors.push(e) });
      service.updateLogistics('c-1', 'propia').subscribe({ error: (e: Error) => errors.push(e) });
      service
        .createSeller('c-1', {
          name: 'Vera',
          email: 'vera@tienda.test',
          password: 'secreto123',
          participationPercentage: 10,
        })
        .subscribe({ error: (e: Error) => errors.push(e) });

      expect(errors).toHaveLength(7);
      expect(errors.every((error) => error.message.includes('apiUrl no configurado'))).toBe(true);
    });
  });
});
