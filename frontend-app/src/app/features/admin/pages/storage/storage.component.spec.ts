import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import AdminStorageComponent from './storage.component';
import { StorageStore } from '../../state/storage/storage.store';
import { SeoService } from '../../../../core/services/seo/seo.service';
import type { StorageTenant } from '../../models/storage.model';

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

const suspended: StorageTenant = {
  ...tenant,
  tenantId: 'tenant-2',
  bucket: 't-tenant-2',
  quotaBytes: 2147483648,
  usedBytes: 2147483648,
  availableBytes: 0,
  objects: 5,
  status: 'suspendido',
};

describe('AdminStorageComponent', () => {
  const tenants = signal<StorageTenant[]>([]);
  const loading = signal(false);
  const error = signal<string | null>(null);
  const savingId = signal<string | null>(null);
  const recalculatingId = signal<string | null>(null);
  const total = signal(0);
  const page = signal(1);
  const pages = signal(0);
  const store = {
    tenants: tenants.asReadonly(),
    loading: loading.asReadonly(),
    error: error.asReadonly(),
    savingId: savingId.asReadonly(),
    recalculatingId: recalculatingId.asReadonly(),
    total: total.asReadonly(),
    page: page.asReadonly(),
    pages: pages.asReadonly(),
    hasTenants: computed(() => tenants().length > 0),
    totalUsedBytes: computed(() => tenants().reduce((sum, item) => sum + item.usedBytes, 0)),
    totalQuotaBytes: computed(() => tenants().reduce((sum, item) => sum + item.quotaBytes, 0)),
    activeCount: computed(() => tenants().filter((item) => item.status === 'activo').length),
    totalTenants: total.asReadonly(),
    load: vi.fn(),
    updateQuota: vi.fn(),
    setStatus: vi.fn(),
    recalculate: vi.fn(),
  };
  const seo = { setPage: vi.fn(), reset: vi.fn() };

  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [AdminStorageComponent],
      providers: [
        provideRouter([]),
        { provide: StorageStore, useValue: store },
        { provide: SeoService, useValue: seo },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(AdminStorageComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    tenants.set([]);
    loading.set(false);
    error.set(null);
    savingId.set(null);
    recalculatingId.set(null);
    total.set(0);
    page.set(1);
    pages.set(0);
    TestBed.resetTestingModule();
  });

  it('debe cargar el almacenamiento al entrar', async () => {
    await setup();

    expect(store.load).toHaveBeenCalled();
  });

  it('debe listar tenants con uso y estado', async () => {
    tenants.set([tenant, suspended]);
    total.set(2);
    const fixture = await setup();

    expect(fixture.nativeElement.querySelectorAll('[data-testid="storage-row"]')).toHaveLength(2);
    expect(fixture.nativeElement.textContent).toContain('t-tenant-1');
    expect(fixture.nativeElement.textContent).toContain('1.50 GB');
    expect(
      fixture.nativeElement.querySelector('[data-testid="storage-status-tenant-2"]').textContent,
    ).toContain('Suspendido');
  });

  it('debe guardar la cuota en GB convertida a bytes', async () => {
    tenants.set([tenant]);
    const fixture = await setup();

    const input = fixture.nativeElement.querySelector(
      '[data-testid="storage-quota-input-tenant-1"]',
    ) as HTMLInputElement;
    input.value = '6';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    fixture.nativeElement
      .querySelector('[data-testid="storage-save-tenant-1"]')
      .dispatchEvent(new Event('click'));

    expect(store.updateQuota).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      quotaBytes: 6442450944,
    });
  });

  it('debe suspender/reactivar y recalcular', async () => {
    tenants.set([suspended]);
    const fixture = await setup();

    fixture.nativeElement
      .querySelector('[data-testid="storage-toggle-tenant-2"]')
      .dispatchEvent(new Event('click'));
    expect(store.setStatus).toHaveBeenCalledWith({ tenantId: 'tenant-2', status: 'activo' });

    fixture.nativeElement
      .querySelector('[data-testid="storage-recalc-tenant-2"]')
      .dispatchEvent(new Event('click'));
    expect(store.recalculate).toHaveBeenCalledWith('tenant-2');
  });

  it('debe mostrar carga, vacío y error', async () => {
    loading.set(true);
    const fixture = await setup();
    expect(fixture.nativeElement.querySelector('[role="status"]')).not.toBeNull();

    loading.set(false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-testid="storage-empty"]')).not.toBeNull();

    error.set('No se pudo cargar el almacenamiento.');
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('[data-testid="storage-error"]').textContent,
    ).toContain('No se pudo cargar el almacenamiento.');
  });
});
