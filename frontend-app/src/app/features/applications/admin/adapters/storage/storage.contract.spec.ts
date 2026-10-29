import { adaptStoragePageFromBackend } from './storage.adapter';
import { STORAGE_TENANTS_FIXTURE } from '../fixtures/storage.fixture';

// R-C-8: contrato contra `EstadoBucketResponseDto` versionado.
describe('admin-storage.contract', () => {
  it('normaliza la página de buckets del gateway', () => {
    const page = adaptStoragePageFromBackend({
      items: STORAGE_TENANTS_FIXTURE,
      total: 2,
      pagina: 1,
      limite: 20,
      paginas: 1,
    });

    expect(page).toMatchObject({ total: 2, page: 1, limit: 20, pages: 1 });
    expect(page.items[0]).toMatchObject({
      tenantId: 'tenant-1',
      bucket: 't-tenant-1',
      quotaBytes: 5368709120,
      status: 'activo',
    });
  });
});
