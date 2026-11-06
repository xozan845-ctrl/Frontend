import {
  adaptPresignedUploadFromBackend,
  adaptStorageBucketFromBackend,
  adaptStorageDownloadFromBackend,
  adaptStorageObjectPageFromBackend,
} from './storage.adapter';
import {
  BUCKET_FIXTURE,
  DOWNLOAD_FIXTURE,
  OBJECTS_FIXTURE,
  PRESIGNED_FIXTURE,
} from '../fixtures/storage.fixture';

// R-C-8: contrato contra los DTOs públicos de Storage versionados.
describe('storage.contract', () => {
  it('normaliza bucket, objetos y paginación', () => {
    expect(adaptStorageBucketFromBackend(BUCKET_FIXTURE)).toMatchObject({
      tenantId: 'tenant-1',
      bucket: 't-tenant-1',
      quotaBytes: 5368709120,
      objects: 2,
    });
    expect(
      adaptStorageObjectPageFromBackend({
        items: OBJECTS_FIXTURE,
        total: 2,
        pagina: 1,
        limite: 20,
        paginas: 1,
      }),
    ).toMatchObject({ total: 2, page: 1, limit: 20, pages: 1 });
  });

  it('normaliza URLs prefirmadas de subida y descarga', () => {
    expect(adaptPresignedUploadFromBackend(PRESIGNED_FIXTURE)).toMatchObject({
      objectId: 'objeto-3',
      uploadUrl: '/api/v1/storage/subida-mock',
      method: 'PUT',
    });
    expect(adaptStorageDownloadFromBackend(DOWNLOAD_FIXTURE)).toMatchObject({
      name: 'foto.png',
      contentType: 'image/png',
      sizeBytes: 204800,
    });
  });
});
