import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { StorageStore } from './storage.store';
import { STORAGE_REPOSITORY, StorageRepository } from '../../repositories/storage.repository';
import { NotificationService } from '../../../../core/services/notification/notification.service';
import {
  PresignedUpload,
  StorageBucket,
  StorageDownload,
  StorageObject,
  StorageObjectPage,
} from '../../models/storage.model';

const bucket: StorageBucket = {
  tenantId: 'tenant-1',
  bucket: 't-tenant-1',
  quotaBytes: 5368709120,
  usedBytes: 1610612736,
  availableBytes: 3758096384,
  objects: 2,
  status: 'activo',
  createdAt: '2026-10-21T10:00:00.000Z',
  updatedAt: '2026-10-23T10:00:00.000Z',
};

const object: StorageObject = {
  id: 'objeto-1',
  bucket: 't-tenant-1',
  key: 'productos/objeto-1/foto.png',
  name: 'foto.png',
  contentType: 'image/png',
  folder: 'productos',
  description: 'Foto',
  tags: {},
  sizeBytes: 204800,
  status: 'activo',
  uploadedBy: 'user-1',
  createdAt: '2026-10-22T10:00:00.000Z',
  confirmedAt: '2026-10-22T10:01:00.000Z',
  deletedAt: null,
};

const page: StorageObjectPage = {
  items: [object],
  total: 1,
  page: 1,
  limit: 20,
  pages: 1,
};

const presigned: PresignedUpload = {
  objectId: 'objeto-2',
  bucket: 't-tenant-1',
  key: 'productos/objeto-2/nuevo.png',
  uploadUrl: '/subida',
  method: 'PUT',
  headers: { 'Content-Type': 'image/png' },
  expiresAt: '',
  maxBytes: 1024,
};

describe('StorageStore', () => {
  let repo: StorageRepository;
  const notification = { showSuccess: vi.fn(), showError: vi.fn(), showInfo: vi.fn() };

  const setup = () => {
    repo = {
      bucket: vi.fn(() => of<StorageBucket>(bucket)),
      objects: vi.fn(() => of<StorageObjectPage>(page)),
      requestUpload: vi.fn(() => of<PresignedUpload>(presigned)),
      uploadToUrl: vi.fn(() => of<void>(undefined)),
      confirm: vi.fn(() => of<StorageObject>({ ...object, id: 'objeto-2', name: 'nuevo.png' })),
      download: vi.fn(() =>
        of<StorageDownload>({
          url: 'https://minio.test/file',
          expiresAt: '',
          name: 'foto.png',
          contentType: 'image/png',
          sizeBytes: 204800,
        }),
      ),
      delete: vi.fn(() => of<void>(undefined)),
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

  it('debe cargar bucket y objetos', async () => {
    const store = setup();

    store.load();

    await vi.waitFor(() => expect(store.objects()).toHaveLength(1));
    expect(store.bucket()?.bucket).toBe('t-tenant-1');
    expect(store.bucketUsage()).toBe(30);
    expect(store.activeObjects()).toBe(1);
  });

  it('debe filtrar por texto y estado', async () => {
    const store = setup();
    store.load();
    await vi.waitFor(() => expect(store.objects()).toHaveLength(1));

    store.setQuery('foto');
    expect(store.filteredObjects()).toHaveLength(1);

    store.setQuery('factura');
    expect(store.filteredObjects()).toHaveLength(0);

    store.setQuery('');
    store.setStatusFilter('activo');
    expect(store.filteredObjects()).toHaveLength(1);

    store.setStatusFilter('pendiente');
    expect(store.filteredObjects()).toHaveLength(0);
  });

  it('debe orquestar la subida prefirmada', async () => {
    const store = setup();
    const file = new File(['hola'], 'nuevo.png', { type: 'image/png' });

    store.upload({
      name: 'nuevo.png',
      contentType: 'image/png',
      sizeBytes: 4,
      file,
    });

    await vi.waitFor(() => expect(store.uploading()).toBe(false));
    expect(repo.requestUpload).toHaveBeenCalledWith({
      name: 'nuevo.png',
      contentType: 'image/png',
      sizeBytes: 4,
    });
    expect(repo.uploadToUrl).toHaveBeenCalledWith('/subida', { 'Content-Type': 'image/png' }, file);
    expect(repo.confirm).toHaveBeenCalledWith('objeto-2');
    expect(notification.showSuccess).toHaveBeenCalledWith('Archivo subido.');
  });

  it('debe obtener descarga y eliminar objetos', async () => {
    const store = setup();
    store.load();
    await vi.waitFor(() => expect(store.objects()).toHaveLength(1));

    store.download('objeto-1');
    await vi.waitFor(() => expect(store.downloadUrl()).toBe('https://minio.test/file'));

    store.clearDownload();
    expect(store.downloadUrl()).toBeNull();

    store.requestDelete('objeto-1');
    expect(store.pendingDeleteId()).toBe('objeto-1');
    store.delete('objeto-1');
    await vi.waitFor(() => expect(store.deletingId()).toBeNull());
    expect(repo.delete).toHaveBeenCalledWith('objeto-1');
  });

  it('debe registrar errores de carga, subida y descarga', async () => {
    const store = setup();
    vi.mocked(repo.bucket).mockReturnValue(throwError(() => new Error('')));

    store.load();
    await vi.waitFor(() => expect(store.error()).toBe('No se pudo cargar el almacenamiento.'));

    vi.mocked(repo.bucket).mockReturnValue(of<StorageBucket>(bucket));
    store.load();
    await vi.waitFor(() => expect(store.objects()).toHaveLength(1));

    vi.mocked(repo.requestUpload).mockReturnValue(throwError(() => new Error('')));
    store.upload({
      name: 'x.png',
      contentType: 'image/png',
      sizeBytes: 1,
      file: new File(['x'], 'x.png', { type: 'image/png' }),
    });
    await vi.waitFor(() => expect(store.error()).toBe('No se pudo subir el archivo.'));
    expect(store.uploading()).toBe(false);

    vi.mocked(repo.download).mockReturnValue(throwError(() => new Error('')));
    store.download('objeto-1');
    await vi.waitFor(() => expect(store.error()).toBe('No se pudo descargar el archivo.'));
    expect(store.downloadingId()).toBeNull();
  });

  it('debe registrar el error al eliminar', async () => {
    const store = setup();
    store.load();
    await vi.waitFor(() => expect(store.objects()).toHaveLength(1));

    vi.mocked(repo.delete).mockReturnValue(throwError(() => new Error('')));
    store.delete('objeto-1');

    await vi.waitFor(() => expect(store.error()).toBe('No se pudo eliminar el archivo.'));
    expect(store.deletingId()).toBeNull();
    expect(store.pendingDeleteId()).toBeNull();
  });

  it('debe limpiar y reiniciar', async () => {
    const store = setup();
    store.load();
    await vi.waitFor(() => expect(store.objects()).toHaveLength(1));

    store.clearError();
    expect(store.error()).toBeNull();

    store.reset();
    expect(store.objects()).toEqual([]);
    expect(store.bucket()).toBeNull();
  });
});
