import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { CompanyStore } from './company.store';
import { COMPANY_REPOSITORY, CompanyRepository } from '../../repositories/company.repository';
import { AuthStore } from '../../../auth/public-api';
import { NotificationService } from '../../../../core/services/notification.service';
import { Company, CompanySeller } from '../../models/company.model';

const company: Company = {
  id: 'c-1',
  name: 'Mi Empresa',
  logisticsMode: 'plataforma',
  status: 'activa',
  createdBy: 'u-1',
  createdAt: '2026-10-21T00:00:00.000Z',
};

const seller: CompanySeller = {
  id: 's-1',
  name: 'Vera',
  email: 'vera@tienda.test',
  role: 'vendedor',
  participationPercentage: 25,
};

describe('CompanyStore', () => {
  let repo: CompanyRepository;
  let authStore: { refreshTokenOnce: ReturnType<typeof vi.fn> };
  let notification: { showSuccess: ReturnType<typeof vi.fn>; showError: ReturnType<typeof vi.fn> };

  const setup = () => {
    repo = {
      create: vi.fn(() => of(company)),
      getById: vi.fn(() => of(company)),
      updateLogistics: vi.fn(() => of<Company>({ ...company, logisticsMode: 'propia' as const })),
      createSeller: vi.fn(() => of(seller)),
    };
    authStore = { refreshTokenOnce: vi.fn().mockResolvedValue(true) };
    notification = { showSuccess: vi.fn(), showError: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        CompanyStore,
        { provide: COMPANY_REPOSITORY, useValue: repo },
        { provide: AuthStore, useValue: authStore },
        { provide: NotificationService, useValue: notification },
      ],
    });
    return TestBed.inject(CompanyStore);
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe iniciar sin empresa', () => {
    const store = setup();

    expect(store.company()).toBeNull();
    expect(store.sellers()).toEqual([]);
    expect(store.hasCompany()).toBe(false);
  });

  it('debe cargar la empresa por id', async () => {
    const store = setup();

    store.load('c-1');

    await vi.waitFor(() => expect(store.company()).toEqual(company));
    expect(repo.getById).toHaveBeenCalledWith('c-1');
    expect(store.loading()).toBe(false);
    expect(store.hasCompany()).toBe(true);
  });

  it('debe registrar el error al cargar la empresa', async () => {
    const store = setup();
    vi.mocked(repo.getById).mockReturnValue(throwError(() => new Error('sin conexión')));

    store.load('c-1');

    await vi.waitFor(() => expect(store.error()).toBe('sin conexión'));
    expect(store.loading()).toBe(false);
    expect(notification.showError).toHaveBeenCalledWith('sin conexión');
  });

  it('debe crear la empresa y renovar la sesión para obtener el tenant', async () => {
    const store = setup();

    store.create({ name: 'Mi Empresa', logisticsMode: 'plataforma' });

    await vi.waitFor(() => expect(store.company()).toEqual(company));
    expect(repo.create).toHaveBeenCalledWith({
      name: 'Mi Empresa',
      logisticsMode: 'plataforma',
    });
    expect(authStore.refreshTokenOnce).toHaveBeenCalled();
    expect(store.saving()).toBe(false);
    expect(notification.showSuccess).toHaveBeenCalledWith('Empresa "Mi Empresa" creada.');
  });

  it('debe conservar la empresa y avisar si la sesión no se renueva', async () => {
    const store = setup();
    authStore.refreshTokenOnce.mockResolvedValue(false);

    store.create({ name: 'Mi Empresa', logisticsMode: 'plataforma' });

    await vi.waitFor(() => expect(store.company()).toEqual(company));
    expect(store.error()).toContain('la sesión no se pudo renovar');
    expect(notification.showError).toHaveBeenCalled();
  });

  it('debe registrar el error al crear la empresa', async () => {
    const store = setup();
    vi.mocked(repo.create).mockReturnValue(throwError(() => new Error('correo duplicado')));

    store.create({ name: 'Mi Empresa', logisticsMode: 'plataforma' });

    await vi.waitFor(() => expect(store.error()).toBe('correo duplicado'));
    expect(store.company()).toBeNull();
    expect(notification.showError).toHaveBeenCalledWith('correo duplicado');
  });

  it('debe actualizar la modalidad logística de la empresa activa', async () => {
    const store = setup();
    store.load('c-1');
    await vi.waitFor(() => expect(store.company()).toEqual(company));

    store.updateLogistics('propia');

    await vi.waitFor(() => expect(store.company()?.logisticsMode).toBe('propia'));
    expect(repo.updateLogistics).toHaveBeenCalledWith('c-1', 'propia');
    expect(notification.showSuccess).toHaveBeenCalledWith('Modalidad logística actualizada.');
  });

  it('no debe actualizar la logística sin empresa cargada', () => {
    const store = setup();

    store.updateLogistics('propia');

    expect(repo.updateLogistics).not.toHaveBeenCalled();
  });

  it('debe registrar el error al actualizar la logística', async () => {
    const store = setup();
    store.load('c-1');
    await vi.waitFor(() => expect(store.company()).toEqual(company));
    vi.mocked(repo.updateLogistics).mockReturnValue(
      throwError(() => new Error('solo un empresario activo')),
    );

    store.updateLogistics('propia');

    await vi.waitFor(() => expect(store.error()).toBe('solo un empresario activo'));
    expect(store.saving()).toBe(false);
  });

  it('debe crear un vendedor y añadirlo a la lista de la sesión', async () => {
    const store = setup();
    store.load('c-1');
    await vi.waitFor(() => expect(store.company()).toEqual(company));

    store.createSeller({
      name: 'Vera',
      email: 'vera@tienda.test',
      password: 'secreto123',
      participationPercentage: 25,
    });

    await vi.waitFor(() => expect(store.sellers()).toEqual([seller]));
    expect(repo.createSeller).toHaveBeenCalledWith('c-1', {
      name: 'Vera',
      email: 'vera@tienda.test',
      password: 'secreto123',
      participationPercentage: 25,
    });
    expect(notification.showSuccess).toHaveBeenCalledWith('Vendedor Vera creado.');
  });

  it('no debe crear vendedor sin empresa cargada', () => {
    const store = setup();

    store.createSeller({
      name: 'Vera',
      email: 'vera@tienda.test',
      password: 'secreto123',
      participationPercentage: 25,
    });

    expect(repo.createSeller).not.toHaveBeenCalled();
  });

  it('debe registrar el error al crear el vendedor', async () => {
    const store = setup();
    store.load('c-1');
    await vi.waitFor(() => expect(store.company()).toEqual(company));
    vi.mocked(repo.createSeller).mockReturnValue(
      throwError(() => new Error('ya existe una cuenta con ese correo')),
    );

    store.createSeller({
      name: 'Vera',
      email: 'vera@tienda.test',
      password: 'secreto123',
      participationPercentage: 25,
    });

    await vi.waitFor(() => expect(store.error()).toBe('ya existe una cuenta con ese correo'));
    expect(store.sellers()).toEqual([]);
  });

  it('debe limpiar el error y reiniciar el estado', async () => {
    const store = setup();
    store.load('c-1');
    await vi.waitFor(() => expect(store.company()).toEqual(company));
    vi.mocked(repo.updateLogistics).mockReturnValue(throwError(() => new Error('boom')));
    store.updateLogistics('propia');
    await vi.waitFor(() => expect(store.error()).toBe('boom'));

    store.clearError();
    expect(store.error()).toBeNull();

    store.reset();
    expect(store.company()).toBeNull();
    expect(store.sellers()).toEqual([]);
  });

  it('debe usar el mensaje por defecto cuando falla la carga sin mensaje', async () => {
    const store = setup();
    vi.mocked(repo.getById).mockReturnValue(throwError(() => new Error('')));

    store.load('c-1');

    await vi.waitFor(() => expect(store.error()).toBe('No se pudo cargar la empresa.'));
  });

  it('debe usar el mensaje por defecto cuando falla el alta sin mensaje', async () => {
    const store = setup();
    vi.mocked(repo.create).mockReturnValue(throwError(() => new Error('')));

    store.create({ name: 'Mi Empresa', logisticsMode: 'plataforma' });

    await vi.waitFor(() => expect(store.error()).toBe('No se pudo crear la empresa.'));
  });

  it('debe usar el mensaje por defecto cuando falla la logística sin mensaje', async () => {
    const store = setup();
    store.load('c-1');
    await vi.waitFor(() => expect(store.company()).toEqual(company));
    vi.mocked(repo.updateLogistics).mockReturnValue(throwError(() => new Error('')));

    store.updateLogistics('propia');

    await vi.waitFor(() =>
      expect(store.error()).toBe('No se pudo actualizar la modalidad logística.'),
    );
  });

  it('debe usar el mensaje por defecto cuando falla el vendedor sin mensaje', async () => {
    const store = setup();
    store.load('c-1');
    await vi.waitFor(() => expect(store.company()).toEqual(company));
    vi.mocked(repo.createSeller).mockReturnValue(throwError(() => new Error('')));

    store.createSeller({
      name: 'Vera',
      email: 'vera@tienda.test',
      password: 'secreto123',
      participationPercentage: 25,
    });

    await vi.waitFor(() => expect(store.error()).toBe('No se pudo crear el vendedor.'));
  });
});
