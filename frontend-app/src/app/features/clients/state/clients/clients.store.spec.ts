import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ClientsStore } from './clients.store';
import {
  CLIENTS_DATA_SOURCE,
  type ClientsDataSource,
} from '../../repositories/clients-data-source.repository';
import { NotificationService } from '../../../../core/services/notification/notification.service';
import { clientsStorageKey } from '../../constants/clients.constants';
import type { ClientOrder } from '../../models/client.model';

function daysAgo(days: number): string {
  return new Date(2026, 9, 27 - days, 12, 0, 0).toISOString();
}

const order: ClientOrder = {
  id: 'o-1',
  status: 'pagada',
  total: 350,
  createdAt: daysAgo(2),
  buyerId: 'buyer-1',
};

describe('ClientsStore', () => {
  let dataSource: ClientsDataSource;
  const notification = { showSuccess: vi.fn(), showError: vi.fn(), showInfo: vi.fn() };

  const setup = () => {
    dataSource = {
      orders: vi.fn(() => of<ClientOrder[]>([order])),
      storageKey: vi.fn(() => clientsStorageKey('company', 'empresa-1')),
    };
    TestBed.configureTestingModule({
      providers: [
        ClientsStore,
        { provide: CLIENTS_DATA_SOURCE, useValue: dataSource },
        { provide: NotificationService, useValue: notification },
      ],
    });
    return TestBed.inject(ClientsStore);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  afterEach(() => localStorage.clear());

  it('debe cargar las compras y derivar la cartera', async () => {
    const store = setup();

    store.loadOrders();
    await vi.waitFor(() => expect(store.orders()).toHaveLength(1));

    expect(dataSource.orders).toHaveBeenCalled();
    expect(store.ordersLoading()).toBe(false);
    expect(store.allClients()).toHaveLength(1);
    expect(store.allClients()[0]).toMatchObject({
      name: 'Cliente BUYER-1',
      ordersCount: 1,
      totalSpent: 350,
    });
    expect(store.kpis().totalClients).toBe(1);
    expect(store.hasClients()).toBe(true);
  });

  it('debe registrar un cliente manual y persistirlo por tenant', async () => {
    const store = setup();

    const result = store.addLocalClient({
      name: '  Pedro Ruiz ',
      phone: ' 8888 1111 ',
      email: ' PEDRO@CORREO.COM ',
      company: ' Norte ',
    });

    expect(result.ok).toBe(true);
    expect(store.localClients()).toHaveLength(1);
    expect(store.localClients()[0]).toMatchObject({
      name: 'Pedro Ruiz',
      phone: '8888 1111',
      email: 'pedro@correo.com',
      company: 'Norte',
      source: 'manual',
    });
    expect(notification.showSuccess).toHaveBeenCalledWith('Cliente Pedro Ruiz agregado.');

    await vi.waitFor(() => {
      const stored = JSON.parse(
        localStorage.getItem(clientsStorageKey('company', 'empresa-1')) ?? '[]',
      ) as unknown[];
      expect(stored).toHaveLength(1);
    });
  });

  it('debe rechazar un cliente duplicado por correo o teléfono', () => {
    const store = setup();

    expect(store.addLocalClient({ name: 'Pedro', email: 'pedro@correo.com' }).ok).toBe(true);
    const duplicate = store.addLocalClient({ name: 'Otro Pedro', email: 'PEDRO@correo.com' });

    expect(duplicate).toEqual({
      ok: false,
      message: 'Ya existe un cliente con ese comprador, correo o teléfono.',
    });
    expect(store.localClients()).toHaveLength(1);
  });

  it('debe importar filas válidas y omitir duplicadas o inválidas', () => {
    const store = setup();
    store.addLocalClient({ name: 'Carla', email: 'carla@correo.com' });

    const result = store.importCsv(
      'nombre,email\n' +
        'Carla,carla@correo.com\n' +
        'Pedro,pedro@correo.com\n' +
        'Invalido,no-es-correo\n',
    );

    expect(result.imported).toBe(1);
    expect(result.skipped).toBe(2);
    expect(result.errors).toEqual(['Fila 4: correo inválido (no-es-correo).']);
    expect(store.localClients()).toHaveLength(2);
    expect(notification.showSuccess).toHaveBeenCalledWith('1 cliente importado.');
    expect(notification.showInfo).toHaveBeenCalledWith(
      '2 filas se omitieron por estar duplicadas o incompletas.',
    );
  });

  it('debe rechazar una importación sin filas nuevas', () => {
    const store = setup();
    store.addLocalClient({ name: 'Carla', email: 'carla@correo.com' });

    const result = store.importCsv('nombre,email\nCarla,carla@correo.com\n');

    expect(result.imported).toBe(0);
    expect(result.skipped).toBe(1);
    expect(notification.showError).toHaveBeenCalledWith(
      'No se importó ningún cliente: todas las filas están duplicadas.',
    );
  });

  it('debe rechazar un archivo vacío al importar', () => {
    const store = setup();

    const result = store.importCsv('   ');

    expect(result).toEqual({
      imported: 0,
      skipped: 1,
      errors: ['El archivo está vacío.'],
    });
    expect(notification.showError).toHaveBeenCalledWith('El archivo está vacío.');
  });

  it('debe buscar, filtrar, paginar y limpiar filtros', () => {
    const store = setup();
    for (let index = 1; index <= 12; index += 1) {
      store.addLocalClient({
        name: `Cliente ${String(index).padStart(2, '0')}`,
        email: `cliente${index}@correo.com`,
      });
    }

    expect(store.filteredCount()).toBe(12);
    expect(store.pagedClients()).toHaveLength(10);
    expect(store.currentPage()).toBe(1);
    expect(store.rangeStart()).toBe(1);
    expect(store.rangeEnd()).toBe(10);
    expect(store.isFirstPage()).toBe(true);
    expect(store.isLastPage()).toBe(false);

    store.nextPage();
    expect(store.currentPage()).toBe(2);
    expect(store.pagedClients()).toHaveLength(2);
    expect(store.rangeStart()).toBe(11);
    expect(store.rangeEnd()).toBe(12);
    store.nextPage();
    expect(store.currentPage()).toBe(2);
    store.prevPage();
    expect(store.currentPage()).toBe(1);
    store.prevPage();
    expect(store.currentPage()).toBe(1);
    store.setPage(0);
    expect(store.page()).toBe(1);
    store.setPage(2.9);
    expect(store.page()).toBe(2);
    store.setPage(1);

    store.setSearch('cliente 12');
    expect(store.filteredCount()).toBe(1);
    expect(store.hasSearch()).toBe(true);
    expect(store.hasFilters()).toBe(true);

    store.setSearch('');
    store.setTab('top');
    expect(store.filteredCount()).toBe(0);
    expect(store.hasFilters()).toBe(true);

    store.setTab('list');
    store.setChip('without-orders');
    expect(store.filteredCount()).toBe(12);
    store.setChip('with-orders');
    expect(store.filteredCount()).toBe(0);

    store.clearFilters();
    expect(store.search()).toBe('');
    expect(store.tab()).toBe('list');
    expect(store.chip()).toBe('all');
    expect(store.currentPage()).toBe(1);
    expect(store.hasFilters()).toBe(false);
  });

  it('debe hidratar la cartera guardada y tolerar storage corrupto', () => {
    localStorage.setItem(
      clientsStorageKey('company', 'empresa-1'),
      JSON.stringify([
        {
          id: 'local-1',
          name: 'Carla',
          phone: '8888',
          email: 'carla@correo.com',
          company: 'Norte',
          source: 'manual',
          createdAt: daysAgo(1),
        },
      ]),
    );

    const store = setup();
    expect(store.localClients()).toHaveLength(1);
    expect(store.allClients()[0].name).toBe('Carla');

    TestBed.resetTestingModule();
    localStorage.setItem(clientsStorageKey('company', 'empresa-1'), '{corrupto');
    const second = setup();
    expect(second.localClients()).toEqual([]);
  });

  it('debe iniciar vacío cuando el storage no está disponible', () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });

    const store = setup();
    expect(store.localClients()).toEqual([]);
    getItem.mockRestore();
  });

  it('debe registrar el error al cargar compras', async () => {
    const store = setup();
    vi.mocked(dataSource.orders).mockReturnValue(throwError(() => new Error('')));

    store.loadOrders();
    await vi.waitFor(() => expect(store.error()).toBe('No se pudieron cargar los clientes.'));

    expect(store.ordersLoading()).toBe(false);
    expect(notification.showError).toHaveBeenCalledWith('No se pudieron cargar los clientes.');

    store.clearError();
    expect(store.error()).toBeNull();
  });

  it('debe reiniciar el estado de la cartera', () => {
    const store = setup();
    store.addLocalClient({ name: 'Carla', email: 'carla@correo.com' });

    store.reset();

    expect(store.localClients()).toEqual([]);
    expect(store.orders()).toEqual([]);
    expect(store.search()).toBe('');
    expect(store.tab()).toBe('list');
    expect(store.chip()).toBe('all');
    expect(store.page()).toBe(1);
  });
});
