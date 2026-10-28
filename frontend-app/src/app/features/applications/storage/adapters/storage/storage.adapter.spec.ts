import {
  adaptPresignedUploadFromBackend,
  adaptStorageBucketFromBackend,
  adaptStorageDownloadFromBackend,
  adaptStorageObjectFromBackend,
  adaptStorageObjectPageFromBackend,
} from './storage.adapter';
import {
  BUCKET_FIXTURE,
  DOWNLOAD_FIXTURE,
  OBJECTS_FIXTURE,
  PRESIGNED_FIXTURE,
} from '../fixtures/storage.fixture';

describe('storage.adapter', () => {
  it('debe normalizar bucket y objetos', () => {
    expect(adaptStorageBucketFromBackend(BUCKET_FIXTURE)).toMatchObject({
      bucket: 't-tenant-1',
      quotaBytes: 5368709120,
      usedBytes: 1610612736,
      objects: 2,
      status: 'activo',
    });
    expect(adaptStorageObjectFromBackend(OBJECTS_FIXTURE[0])).toMatchObject({
      id: 'objeto-1',
      name: 'foto.png',
      contentType: 'image/png',
      sizeBytes: 204800,
      status: 'activo',
      tags: { fuente: 'catalogo' },
    });
  });

  it('debe normalizar la página de objetos', () => {
    expect(
      adaptStorageObjectPageFromBackend({
        items: OBJECTS_FIXTURE,
        total: 2,
        pagina: 1,
        limite: 20,
        paginas: 1,
      }),
    ).toMatchObject({ total: 2, page: 1, limit: 20 });
    expect(adaptStorageObjectPageFromBackend(null)).toEqual({
      items: [],
      total: 0,
      page: 1,
      limit: 20,
      pages: 0,
    });
  });

  it('debe tolerar camelCase, estados y etiquetas inválidas', () => {
    expect(
      adaptStorageBucketFromBackend({
        bucket: 'b',
        cuotaBytes: '2048',
        usadoBytes: '1024',
        disponibleBytes: '1024',
        objetos: '1',
        estado: 'suspendido',
      }),
    ).toMatchObject({ quotaBytes: 2048, status: 'suspendido' });

    expect(adaptStorageObjectFromBackend({ id: 'o-1', estado: 'pendiente' })?.status).toBe(
      'pendiente',
    );
    expect(adaptStorageObjectFromBackend({ id: 'o-2', estado: 'eliminado' })?.status).toBe(
      'eliminado',
    );
    expect(
      adaptStorageObjectFromBackend({ id: 'o-3', estado: 'otro', etiquetas: { a: 1 } })?.tags,
    ).toEqual({});
    expect(adaptStorageObjectPageFromBackend({ items: [], total: null })).toMatchObject({
      total: 0,
      pages: 0,
    });
  });

  it('debe normalizar subida y descarga prefirmadas', () => {
    expect(adaptPresignedUploadFromBackend(PRESIGNED_FIXTURE)).toMatchObject({
      objectId: 'objeto-3',
      uploadUrl: '/api/v1/storage/subida-mock',
      method: 'PUT',
    });
    expect(adaptStorageDownloadFromBackend(DOWNLOAD_FIXTURE)).toMatchObject({
      name: 'foto.png',
      sizeBytes: 204800,
    });
    expect(adaptStorageBucketFromBackend({})).toBeNull();
    expect(adaptStorageObjectFromBackend({})).toBeNull();
    expect(adaptPresignedUploadFromBackend({})).toBeNull();
    expect(adaptStorageDownloadFromBackend({})).toBeNull();
  });
});
