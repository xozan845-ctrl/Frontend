import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import StorageComponent from './storage.component';
import { StorageStore } from '../../state/storage/storage.store';
import { SeoService } from '../../../../core/services/seo/seo.service';
import type { StorageBucket, StorageObject } from '../../models/storage.model';

const bucket: StorageBucket = {
  tenantId: 'tenant-1',
  bucket: 't-tenant-1',
  quotaBytes: 5368709120,
  usedBytes: 1610612736,
  availableBytes: 3758096384,
  objects: 1,
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

describe('StorageComponent', () => {
  const objects = signal<StorageObject[]>([]);
  const bucketSignal = signal<StorageBucket | null>(null);
  const loading = signal(false);
  const error = signal<string | null>(null);
  const uploading = signal(false);
  const downloadingId = signal<string | null>(null);
  const deletingId = signal<string | null>(null);
  const pendingDeleteId = signal<string | null>(null);
  const query = signal('');
  const statusFilter = signal<string | null>(null);
  const downloadUrl = signal<string | null>(null);
  const filteredObjects = computed(() =>
    objects().filter(
      (item) =>
        (!statusFilter() || item.status === statusFilter()) &&
        (!query() || item.name.toLowerCase().includes(query().toLowerCase())),
    ),
  );
  const store = {
    bucket: bucketSignal.asReadonly(),
    objects: objects.asReadonly(),
    loading: loading.asReadonly(),
    error: error.asReadonly(),
    uploading: uploading.asReadonly(),
    downloadingId: downloadingId.asReadonly(),
    deletingId: deletingId.asReadonly(),
    pendingDeleteId: pendingDeleteId.asReadonly(),
    query: query.asReadonly(),
    statusFilter: statusFilter.asReadonly(),
    downloadUrl: downloadUrl.asReadonly(),
    filteredObjects,
    bucketUsage: computed(() => 30),
    activeObjects: computed(() => objects().filter((item) => item.status === 'activo').length),
    hasObjects: computed(() => objects().length > 0),
    load: vi.fn(),
    upload: vi.fn(),
    download: vi.fn(),
    requestDelete: vi.fn(),
    cancelDelete: vi.fn(),
    delete: vi.fn(),
    setQuery: vi.fn((value: string) => query.set(value)),
    setStatusFilter: vi.fn((value: string | null) => statusFilter.set(value)),
    clearDownload: vi.fn(),
  };
  const seo = { setPage: vi.fn(), reset: vi.fn() };

  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [StorageComponent],
      providers: [
        { provide: StorageStore, useValue: store },
        { provide: SeoService, useValue: seo },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(StorageComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    objects.set([]);
    bucketSignal.set(null);
    loading.set(false);
    error.set(null);
    uploading.set(false);
    downloadingId.set(null);
    deletingId.set(null);
    pendingDeleteId.set(null);
    query.set('');
    statusFilter.set(null);
    downloadUrl.set(null);
    TestBed.resetTestingModule();
  });

  it('debe cargar el almacenamiento al entrar', async () => {
    await setup();

    expect(store.load).toHaveBeenCalled();
  });

  it('debe mostrar bucket, objetos y filtrar', async () => {
    bucketSignal.set(bucket);
    objects.set([object]);
    const fixture = await setup();

    expect(
      fixture.nativeElement.querySelector('[data-testid="storage-used"]').textContent,
    ).toContain('1.50 GB');
    expect(
      fixture.nativeElement.querySelectorAll('[data-testid="storage-object-row"]'),
    ).toHaveLength(1);

    const search = fixture.nativeElement.querySelector(
      '[data-testid="storage-search"]',
    ) as HTMLInputElement;
    search.value = 'foto';
    search.dispatchEvent(new Event('input'));
    expect(store.setQuery).toHaveBeenCalledWith('foto');

    const status = fixture.nativeElement.querySelector(
      '[data-testid="storage-status-filter"]',
    ) as HTMLSelectElement;
    status.value = 'activo';
    status.dispatchEvent(new Event('change'));
    expect(store.setStatusFilter).toHaveBeenCalledWith('activo');
  });

  it('debe solicitar la subida del archivo elegido', async () => {
    bucketSignal.set(bucket);
    objects.set([object]);
    const fixture = await setup();
    const file = new File(['hola'], 'nuevo.png', { type: 'image/png' });

    fixture.componentInstance.selectedFile.set(file);
    fixture.componentInstance.folder.set('productos');
    fixture.componentInstance.description.set('Nuevo');
    fixture.detectChanges();
    fixture.nativeElement
      .querySelector('[data-testid="storage-upload-submit"]')
      .dispatchEvent(new Event('click'));

    expect(store.upload).toHaveBeenCalledWith({
      name: 'nuevo.png',
      contentType: 'image/png',
      sizeBytes: 4,
      folder: 'productos',
      description: 'Nuevo',
      file,
    });
  });

  it('debe descargar y confirmar el borrado', async () => {
    bucketSignal.set(bucket);
    objects.set([object]);
    const fixture = await setup();

    fixture.nativeElement
      .querySelector('[data-testid="storage-download-objeto-1"]')
      .dispatchEvent(new Event('click'));
    expect(store.download).toHaveBeenCalledWith('objeto-1');

    fixture.nativeElement
      .querySelector('[data-testid="storage-delete-objeto-1"]')
      .dispatchEvent(new Event('click'));
    expect(store.requestDelete).toHaveBeenCalledWith('objeto-1');

    pendingDeleteId.set('objeto-1');
    fixture.detectChanges();
    fixture.nativeElement
      .querySelector('[data-testid="storage-delete-confirm-objeto-1"]')
      .dispatchEvent(new Event('click'));
    expect(store.delete).toHaveBeenCalledWith('objeto-1');
  });

  it('debe mostrar carga, vacío y error', async () => {
    loading.set(true);
    const fixture = await setup();
    expect(fixture.nativeElement.querySelector('[role="status"]')).not.toBeNull();

    loading.set(false);
    bucketSignal.set(bucket);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-testid="storage-empty"]')).not.toBeNull();

    error.set('No se pudo cargar el almacenamiento.');
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('[data-testid="storage-error"]').textContent,
    ).toContain('No se pudo cargar el almacenamiento.');
  });
});
