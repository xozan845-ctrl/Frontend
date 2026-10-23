import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import EnviosComponent from './envios.component';
import { EnviosStore } from '../../state/envios/envios.store';
import { AuthStore } from '../../../auth/public-api';
import { SeoService } from '../../../../core/services/seo/seo.service';
import type { Shipment } from '../../models/envio.model';

const shipment: Shipment = {
  id: 'e-1',
  guia: 'BGH-ABC123-DEF456',
  orderId: 'o-1',
  companyId: 'emp-1',
  logisticsMode: 'hibrida',
  providerType: null,
  providerTenantId: null,
  status: 'en_preparacion',
  createdAt: '2026-10-22T15:00:00.000Z',
  amount: 2300,
};

describe('EnviosComponent', () => {
  const shipments = signal<Shipment[]>([]);
  const loading = signal(false);
  const error = signal<string | null>(null);
  const assigningId = signal<string | null>(null);
  const advancingId = signal<string | null>(null);
  const statusFilter = signal('');
  const store = {
    shipments: shipments.asReadonly(),
    loading: loading.asReadonly(),
    error: error.asReadonly(),
    statusFilter: statusFilter.asReadonly(),
    filteredShipments: computed(() => {
      const status = statusFilter();
      return status ? shipments().filter((item) => item.status === status) : shipments();
    }),
    assigningId: assigningId.asReadonly(),
    advancingId: advancingId.asReadonly(),
    load: vi.fn(),
    assignProvider: vi.fn(),
    advanceStatus: vi.fn(),
    setStatusFilter: vi.fn((status: string) => statusFilter.set(status)),
  };
  const authUser = signal<{ id: string; role: string }>({ id: 'u-1', role: 'admin' });
  const authStore = { user: authUser.asReadonly() };
  const seo = { setPage: vi.fn(), reset: vi.fn() };

  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [EnviosComponent],
      providers: [
        provideRouter([]),
        { provide: EnviosStore, useValue: store },
        { provide: AuthStore, useValue: authStore },
        { provide: SeoService, useValue: seo },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(EnviosComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    shipments.set([]);
    loading.set(false);
    error.set(null);
    statusFilter.set('');
    assigningId.set(null);
    advancingId.set(null);
    authUser.set({ id: 'u-1', role: 'admin' });
    TestBed.resetTestingModule();
  });

  it('debe cargar los envíos al entrar', async () => {
    await setup();

    expect(store.load).toHaveBeenCalled();
  });

  it('debe listar envíos de admin con monto y filtrar por estado', async () => {
    shipments.set([shipment, { ...shipment, id: 'e-2', guia: 'BGH-2', status: 'enviada' }]);
    const fixture = await setup();

    expect(fixture.nativeElement.querySelectorAll('[data-testid="envio-row"]')).toHaveLength(2);
    expect(fixture.nativeElement.textContent).toContain('C$2,300.00');
    // La guía sin flota asignada no se puede avanzar (el backend exige tenant).
    expect(fixture.nativeElement.querySelector('[data-testid="envio-target-e-1"]')).toBeNull();

    const select = fixture.nativeElement.querySelector(
      '[data-testid="envios-status-filter"]',
    ) as HTMLSelectElement;
    select.value = 'enviada';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('[data-testid="envio-row"]')).toHaveLength(1);
    expect(fixture.nativeElement.textContent).toContain('BGH-2');
  });

  it('debe avanzar el estado del envío desde la fila', async () => {
    shipments.set([
      { ...shipment, providerType: 'plataforma', providerTenantId: 'tenant-plataforma' },
    ]);
    const fixture = await setup();

    const select = fixture.nativeElement.querySelector(
      '[data-testid="envio-target-e-1"]',
    ) as HTMLSelectElement;
    select.value = 'cancelada';
    select.dispatchEvent(new Event('change'));

    fixture.nativeElement
      .querySelector('[data-testid="envio-advance-e-1"]')
      .dispatchEvent(new Event('click'));

    expect(store.advanceStatus).toHaveBeenCalledWith({ id: 'e-1', status: 'cancelada' });
  });

  it('debe asignar flota a un envío híbrido como empresario', async () => {
    authUser.set({ id: 'u-1', role: 'empresario' });
    shipments.set([shipment]);
    const fixture = await setup();

    const select = fixture.nativeElement.querySelector(
      '[data-testid="envio-provider-e-1"]',
    ) as HTMLSelectElement;
    expect(select).not.toBeNull();
    select.value = 'empresa';
    select.dispatchEvent(new Event('change'));

    fixture.nativeElement
      .querySelector('[data-testid="envio-assign-e-1"]')
      .dispatchEvent(new Event('click'));

    expect(store.assignProvider).toHaveBeenCalledWith({ id: 'e-1', provider: 'empresa' });
  });

  it('debe mostrar carga, vacío y error', async () => {
    loading.set(true);
    const fixture = await setup();
    expect(fixture.nativeElement.querySelector('[role="status"]')).not.toBeNull();

    loading.set(false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-testid="envios-empty"]')).not.toBeNull();

    error.set('No se pudieron cargar los envíos.');
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('[data-testid="envios-error"]').textContent,
    ).toContain('No se pudieron cargar los envíos.');
  });
});
