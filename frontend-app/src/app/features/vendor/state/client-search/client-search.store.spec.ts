import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ClientSearchStore } from './client-search.store';
import { CLIENT_REPOSITORY, ClientRepository } from '../../repositories/client.repository';
import { NotificationService } from '../../../../core/services/notification.service';
import { Client } from '../../models/vendor-order.model';

const carla: Client = {
  id: 'vc-1',
  code: 'CL-00125',
  name: 'Carla López',
  phone: '+505 8765 4321',
  email: 'carla.lopez@correo.com',
};

describe('ClientSearchStore', () => {
  let repo: ClientRepository;
  const notification = { showSuccess: vi.fn(), showError: vi.fn(), showInfo: vi.fn() };

  const setup = () => {
    repo = {
      searchClients: vi.fn(() => of([carla])),
      createClient: vi.fn(() => of(carla)),
    };
    TestBed.configureTestingModule({
      providers: [
        ClientSearchStore,
        { provide: CLIENT_REPOSITORY, useValue: repo },
        { provide: NotificationService, useValue: notification },
      ],
    });
    return TestBed.inject(ClientSearchStore);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    TestBed.resetTestingModule();
  });

  afterEach(() => vi.useRealTimers());

  it('debe debouncear la búsqueda y quedarse con el último término', async () => {
    const store = setup();

    store.setQuery('ca');
    store.setQuery('car');
    await vi.advanceTimersByTimeAsync(100);
    store.setQuery('carla');
    await vi.advanceTimersByTimeAsync(300);

    expect(repo.searchClients).toHaveBeenCalledTimes(1);
    expect(repo.searchClients).toHaveBeenCalledWith('carla');
    expect(store.results()).toEqual([carla]);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('no debe repetir la búsqueda del mismo término', async () => {
    const store = setup();

    store.setQuery('carla');
    await vi.advanceTimersByTimeAsync(300);
    store.setQuery('carla');
    await vi.advanceTimersByTimeAsync(300);

    expect(repo.searchClients).toHaveBeenCalledTimes(1);
  });

  it('debe buscar el término saneado (trim)', async () => {
    const store = setup();

    store.setQuery('  carla  ');
    await vi.advanceTimersByTimeAsync(300);

    expect(repo.searchClients).toHaveBeenCalledWith('carla');
  });

  it('debe listar los primeros clientes con la carga inicial', async () => {
    const store = setup();

    store.loadInitial();
    await vi.advanceTimersByTimeAsync(300);

    expect(repo.searchClients).toHaveBeenCalledWith('');
    expect(store.results()).toHaveLength(1);
  });

  it('debe exponer los errores de búsqueda con aviso y mensaje por defecto', async () => {
    const store = setup();
    vi.mocked(repo.searchClients).mockReturnValue(throwError(() => new Error('boom')));

    store.setQuery('carla');
    await vi.advanceTimersByTimeAsync(300);

    expect(store.error()).toBe('boom');
    expect(store.loading()).toBe(false);
    expect(store.results()).toEqual([]);
    expect(notification.showError).toHaveBeenCalledWith('boom');

    vi.mocked(repo.searchClients).mockReturnValue(throwError(() => new Error('')));
    store.setQuery('kemuel');
    await vi.advanceTimersByTimeAsync(300);

    expect(store.error()).toBe('No se pudieron cargar los clientes.');
  });

  it('debe reintentar la consulta actual aunque el término no cambie', async () => {
    const store = setup();
    vi.mocked(repo.searchClients).mockReturnValue(throwError(() => new Error('boom')));

    store.setQuery('carla');
    await vi.advanceTimersByTimeAsync(300);
    expect(store.error()).toBe('boom');

    vi.mocked(repo.searchClients).mockReturnValue(of([carla]));
    store.reload();
    await vi.advanceTimersByTimeAsync(0);

    expect(repo.searchClients).toHaveBeenCalledTimes(2);
    expect(repo.searchClients).toHaveBeenLastCalledWith('carla');
    expect(store.results()).toEqual([carla]);
    expect(store.error()).toBeNull();
    expect(store.loading()).toBe(false);
  });

  it('debe crear el cliente, dejarlo en lastCreated y reconocerlo', async () => {
    const store = setup();
    const created: Client = {
      id: 'vc-126',
      code: 'CL-00126',
      name: 'Salón Vero',
      phone: '',
      email: '',
    };
    vi.mocked(repo.createClient).mockReturnValue(of(created));

    store.createClient({ name: 'Salón Vero', phone: '', email: '' });
    await vi.advanceTimersByTimeAsync(0);

    expect(repo.createClient).toHaveBeenCalledWith({ name: 'Salón Vero', phone: '', email: '' });
    expect(store.creating()).toBe(false);
    expect(store.lastCreated()).toEqual(created);
    expect(store.results()[0]).toEqual(created);
    expect(notification.showSuccess).toHaveBeenCalledWith('Cliente Salón Vero creado.');

    store.acknowledgeCreated();
    expect(store.lastCreated()).toBeNull();
  });

  it('debe reportar el fallo de creación con aviso y mensaje por defecto', async () => {
    const store = setup();
    vi.mocked(repo.createClient).mockReturnValue(throwError(() => new Error('boom')));

    store.createClient({ name: 'X', phone: '', email: '' });
    await vi.advanceTimersByTimeAsync(0);

    expect(store.creating()).toBe(false);
    expect(store.error()).toBe('boom');
    expect(store.lastCreated()).toBeNull();
    expect(notification.showError).toHaveBeenCalledWith('boom');

    vi.mocked(repo.createClient).mockReturnValue(throwError(() => new Error('')));
    store.createClient({ name: 'X', phone: '', email: '' });
    await vi.advanceTimersByTimeAsync(0);

    expect(store.error()).toBe('No se pudo crear el cliente.');
  });

  it('debe resetear el buscador', async () => {
    const store = setup();
    store.setQuery('carla');
    await vi.advanceTimersByTimeAsync(300);

    store.reset();

    expect(store.query()).toBe('');
    expect(store.results()).toEqual([]);
    expect(store.error()).toBeNull();
    expect(store.loading()).toBe(false);
  });
});
