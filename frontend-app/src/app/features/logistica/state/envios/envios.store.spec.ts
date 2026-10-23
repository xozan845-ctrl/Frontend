import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { EnviosStore } from './envios.store';
import { ENVIO_REPOSITORY, EnvioRepository } from '../../repositories/envio.repository';
import { AuthStore } from '../../../auth/public-api';
import { NotificationService } from '../../../../core/services/notification/notification.service';
import { Shipment } from '../../models/envio.model';

const shipment: Shipment = {
  id: 'e-1',
  guia: 'BGH-1',
  orderId: 'o-1',
  companyId: 'emp-1',
  logisticsMode: 'hibrida',
  providerType: null,
  providerTenantId: null,
  status: 'en_preparacion',
  createdAt: '2026-10-22T15:00:00.000Z',
};

describe('EnviosStore', () => {
  let repo: EnvioRepository;
  let role: string;
  const notification = { showSuccess: vi.fn(), showError: vi.fn(), showInfo: vi.fn() };

  const setup = () => {
    repo = {
      listAdmin: vi.fn(() => of([shipment])),
      listCompany: vi.fn(() => of([shipment])),
      assignProvider: vi.fn(() => of<Shipment>({ ...shipment, providerType: 'empresa' })),
      advanceStatus: vi.fn(() => of<Shipment>({ ...shipment, status: 'enviada' })),
    };
    TestBed.configureTestingModule({
      providers: [
        EnviosStore,
        { provide: ENVIO_REPOSITORY, useValue: repo },
        { provide: AuthStore, useValue: { user: () => ({ id: 1, role }) } },
        { provide: NotificationService, useValue: notification },
      ],
    });
    return TestBed.inject(EnviosStore);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    role = 'admin';
    TestBed.resetTestingModule();
  });

  it('debe listar todas las guías para admin', async () => {
    const store = setup();

    store.load();

    await vi.waitFor(() => expect(store.shipments()).toEqual([shipment]));
    expect(repo.listAdmin).toHaveBeenCalled();
    expect(repo.listCompany).not.toHaveBeenCalled();
  });

  it('debe listar las guías de la empresa para empresario', async () => {
    role = 'empresario';
    const store = setup();

    store.load();

    await vi.waitFor(() => expect(store.shipments()).toEqual([shipment]));
    expect(repo.listCompany).toHaveBeenCalled();
    expect(repo.listAdmin).not.toHaveBeenCalled();
  });

  it('debe rechazar roles sin acceso', async () => {
    role = 'vendedor';
    const store = setup();

    store.load();

    await vi.waitFor(() => expect(store.error()).toBe('Tu rol no puede consultar envíos.'));
  });

  it('deriva la lista filtrada por estado', async () => {
    const store = setup();
    store.load();
    await vi.waitFor(() => expect(store.shipments()).toHaveLength(1));

    store.setStatusFilter('enviada');
    expect(store.filteredShipments()).toEqual([]);

    store.setStatusFilter('en_preparacion');
    expect(store.filteredShipments()).toEqual([shipment]);

    store.setStatusFilter('');
    expect(store.filteredShipments()).toEqual([shipment]);
  });

  it('debe asignar flota y actualizar la fila', async () => {
    const store = setup();
    store.load();
    await vi.waitFor(() => expect(store.shipments()).toHaveLength(1));

    store.assignProvider({ id: 'e-1', provider: 'empresa' });

    await vi.waitFor(() => expect(store.shipments()[0].providerType).toBe('empresa'));
    expect(repo.assignProvider).toHaveBeenCalledWith('e-1', 'empresa');
    expect(notification.showSuccess).toHaveBeenCalledWith('Flota asignada al envío.');
  });

  it('debe avanzar el estado y actualizar la fila', async () => {
    const store = setup();
    store.load();
    await vi.waitFor(() => expect(store.shipments()).toHaveLength(1));

    store.advanceStatus({ id: 'e-1', status: 'enviada', reason: 'despacho' });

    await vi.waitFor(() => expect(store.shipments()[0].status).toBe('enviada'));
    expect(repo.advanceStatus).toHaveBeenCalledWith('e-1', 'enviada', 'despacho');
  });

  it('debe registrar errores de carga y mutaciones', async () => {
    const store = setup();
    vi.mocked(repo.listAdmin).mockReturnValue(throwError(() => new Error('')));

    store.load();
    await vi.waitFor(() => expect(store.error()).toBe('No se pudieron cargar los envíos.'));
    expect(notification.showError).toHaveBeenCalledWith('No se pudieron cargar los envíos.');

    store.load();
    await vi.waitFor(() => expect(store.shipments()).toHaveLength(0));
  });

  it('debe registrar errores al asignar flota y avanzar estado', async () => {
    const store = setup();
    store.load();
    await vi.waitFor(() => expect(store.shipments()).toHaveLength(1));

    vi.mocked(repo.assignProvider).mockReturnValue(throwError(() => new Error('')));
    store.assignProvider({ id: 'e-1', provider: 'empresa' });
    await vi.waitFor(() => expect(store.error()).toBe('No se pudo asignar la flota.'));
    expect(store.assigningId()).toBeNull();

    vi.mocked(repo.advanceStatus).mockReturnValue(throwError(() => new Error('')));
    store.advanceStatus({ id: 'e-1', status: 'enviada' });
    await vi.waitFor(() =>
      expect(store.error()).toBe('No se pudo actualizar el estado del envío.'),
    );
    expect(store.advancingId()).toBeNull();
  });

  it('debe limpiar el error y reiniciar el estado', async () => {
    const store = setup();
    store.load();
    await vi.waitFor(() => expect(store.shipments()).toHaveLength(1));

    store.clearError();
    expect(store.error()).toBeNull();

    store.reset();
    expect(store.shipments()).toEqual([]);
    expect(store.loading()).toBe(false);
  });
});
