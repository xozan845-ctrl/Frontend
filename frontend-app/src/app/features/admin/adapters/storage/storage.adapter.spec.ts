import { adaptStoragePageFromBackend, adaptStorageTenantFromBackend } from './storage.adapter';
import { STORAGE_TENANTS_FIXTURE } from '../fixtures/storage.fixture';

describe('storage.adapter', () => {
  it('debe normalizar un tenant con cuota y uso', () => {
    expect(adaptStorageTenantFromBackend(STORAGE_TENANTS_FIXTURE[0])).toEqual({
      tenantId: 'tenant-1',
      bucket: 't-tenant-1',
      quotaBytes: 5368709120,
      usedBytes: 1610612736,
      availableBytes: 3758096384,
      objects: 3,
      status: 'activo',
      createdAt: '2026-10-21T10:00:00.000Z',
      updatedAt: '2026-10-22T10:00:00.000Z',
    });
  });

  it('debe normalizar la página y descartar tenants sin id', () => {
    const page = adaptStoragePageFromBackend({
      items: [...STORAGE_TENANTS_FIXTURE, { bucket: 'sin-id' }],
      total: 2,
      pagina: 1,
      limite: 20,
      paginas: 1,
    });

    expect(page.items).toHaveLength(2);
    expect(page.total).toBe(2);
    expect(page.items[1].status).toBe('suspendido');
    expect(page.page).toBe(1);
  });

  it('debe tolerar camelCase, strings y respuestas incompletas', () => {
    expect(
      adaptStorageTenantFromBackend({
        tenantId: 'tenant-3',
        cuotaBytes: '1024',
        usadoBytes: '512',
        disponibleBytes: '512',
        objetos: '1',
        estado: 'activo',
      }),
    ).toMatchObject({ tenantId: 'tenant-3', quotaBytes: 1024, usedBytes: 512, objects: 1 });

    expect(adaptStorageTenantFromBackend({ bucket: 'sin-id' })).toBeNull();
    expect(adaptStorageTenantFromBackend(null)).toBeNull();
    expect(adaptStoragePageFromBackend(null)).toEqual({
      items: [],
      total: 0,
      page: 1,
      limit: 20,
      pages: 0,
    });
  });
});
