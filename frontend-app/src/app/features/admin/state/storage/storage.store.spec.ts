import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { StorageStore } from './storage.store';
import { STORAGE_REPOSITORY, StorageRepository } from '../../repositories/storage.repository';
import { NotificationService } from '../../../../core/services/notification/notification.service';
import { StoragePage, StorageTenant } from '../../models/storage.model';

const tenant: StorageTenant = {
  tenantId: 'tenant-1',
  bucket: 't-tenant-1',
  quotaBytes: 5368709120,
  usedBytes: 1610612736,
  availableBytes: 3758096384,
  objects: 3,
  status: 'activo',
  createdAt: '2026-10-21T10:00:00.000Z',
  updatedAt: '2026-10-22T10:00:00.000Z',
};

const page: StoragePage = {
  items: [tenant],
  total: 1,
  page: 1,
  limit: 20,
  pages: 1,
};

describe('StorageStore', () => {
  let repo: StorageRepository;
  const notification = { showSuccess: vi.fn(), showError: vi.fn(), showInfo: vi.fn() };

  const setup = () => {
    repo = {
      list: vi.fn(() => of<StoragePage>(page)),
      update: vi.fn(() => of<StorageTenant>({ ...tenant, quotaBytes: 6442450944 })),
      recalculate: vi.fn(() => of<StorageTenant>({ ...tenant, usedBytes: 1610612736 })),
    };
    TestBed.configureTestingModule({
      providers: [
        StorageStore,
        { provide: STORAGE_REPOSITORY, useValue: repo },
        { provide: NotificationService, useValue: notification },
      ],
    });
    return TestBed.inject(StorageStore);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('debe cargar tenants y calcular totales', async () => {
    const store = setup();

    store.load();

    await vi.waitFor(() => expect(store.tenants()).toEqual([tenant]));
    expect(store.totalTenants()).toBe(1);
    expect(store.totalUsedBytes()).toBe(1610612736);
    expect(store.totalQuotaBytes()).toBe(5368709120);
    expect(store.activeCount()).toBe(1);
  });

  it('debe actualizar la cuota y la fila', async () => {
    const store = setup();
    store.load();
    await vi.waitFor(() => expect(store.tenants()).toHaveLength(1));

    store.updateQuota({ tenantId: 'tenant-1', quotaBytes: 6442450944 });

    await vi.waitFor(() => expect(store.tenants()[0].quotaBytes).toBe(6442450944));
    expect(repo.update).toHaveBeenCalledWith('tenant-1', { quotaBytes: 6442450944 });
    expect(notification.showSuccess).toHaveBeenCalledWith('Cuota de almacenamiento actualizada.');
  });

  it('debe suspender y recalcular el uso', async () => {
    const store = setup();
    store.load();
    await vi.waitFor(() => expect(store.tenants()).toHaveLength(1));

    store.setStatus({ tenantId: 'tenant-1', status: 'suspendido' });
    await vi.waitFor(() => expect(store.savingId()).toBeNull());
    expect(repo.update).toHaveBeenCalledWith('tenant-1', { status: 'suspendido' });

    store.recalculate('tenant-1');
    await vi.waitFor(() => expect(store.recalculatingId()).toBeNull());
    expect(repo.recalculate).toHaveBeenCalledWith('tenant-1');
    expect(notification.showSuccess).toHaveBeenCalledWith('Uso de almacenamiento recalculado.');
  });

  it('debe registrar errores de carga y mutaciones', async () => {
    const store = setup();
    vi.mocked(repo.list).mockReturnValue(throwError(() => new Error('')));

    store.load();
    await vi.waitFor(() => expect(store.error()).toBe('No se pudo cargar el almacenamiento.'));
    expect(notification.showError).toHaveBeenCalledWith('No se pudo cargar el almacenamiento.');

    vi.mocked(repo.list).mockReturnValue(of<StoragePage>(page));
    store.load();
    await vi.waitFor(() => expect(store.tenants()).toHaveLength(1));

    vi.mocked(repo.update).mockReturnValue(throwError(() => new Error('')));
    store.updateQuota({ tenantId: 'tenant-1', quotaBytes: 1 });
    await vi.waitFor(() => expect(store.error()).toBe('No se pudo actualizar el almacenamiento.'));
    expect(store.savingId()).toBeNull();

    vi.mocked(repo.recalculate).mockReturnValue(throwError(() => new Error('')));
    store.recalculate('tenant-1');
    await vi.waitFor(() => expect(store.error()).toBe('No se pudo recalcular el uso.'));
  });

  it('debe limpiar el error y reiniciar', async () => {
    const store = setup();
    store.load();
    await vi.waitFor(() => expect(store.tenants()).toHaveLength(1));

    store.clearError();
    expect(store.error()).toBeNull();

    store.reset();
    expect(store.tenants()).toEqual([]);
    expect(store.total()).toBe(0);
  });
});
