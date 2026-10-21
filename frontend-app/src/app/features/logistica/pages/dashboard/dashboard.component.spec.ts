import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SeoService } from '../../../../core/services/seo.service';
import { LEAFLET_API, LeafletApi } from '../../services/leaflet-api.port';
import { LogisticaDashboardStore } from '../../state/logistica-dashboard/logistica-dashboard.store';
import LogisticaDashboardComponent from './dashboard.component';

function createLeafletMock() {
  const markerInstance = { addTo: vi.fn(), bindTooltip: vi.fn() };
  markerInstance.addTo.mockReturnValue(markerInstance);
  markerInstance.bindTooltip.mockReturnValue(markerInstance);

  const layerGroupInstance = { addTo: vi.fn(), clearLayers: vi.fn() };
  layerGroupInstance.addTo.mockReturnValue(layerGroupInstance);

  const mapInstance = {
    zoomIn: vi.fn(),
    zoomOut: vi.fn(),
    setView: vi.fn(),
    remove: vi.fn(),
  };

  return {
    map: vi.fn(() => mapInstance),
    tileLayer: vi.fn(() => ({ addTo: vi.fn() })),
    polyline: vi.fn(() => ({ addTo: vi.fn() })),
    marker: vi.fn(() => markerInstance),
    divIcon: vi.fn(() => ({})),
    layerGroup: vi.fn(() => layerGroupInstance),
    control: { attribution: vi.fn(() => ({ addTo: vi.fn() })) },
  };
}

describe('LogisticaDashboardComponent', () => {
  const seo = { setPage: vi.fn(), reset: vi.fn() };

  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [LogisticaDashboardComponent],
      providers: [
        provideRouter([]),
        LogisticaDashboardStore,
        { provide: LEAFLET_API, useValue: createLeafletMock() as unknown as LeafletApi },
        { provide: SeoService, useValue: seo },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(LogisticaDashboardComponent);
    fixture.detectChanges();
    return fixture;
  };

  const loadDashboard = (fixture: Awaited<ReturnType<typeof setup>>) => {
    vi.advanceTimersByTime(500);
    fixture.detectChanges();
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  afterEach(() => vi.useRealTimers());

  it('debe mostrar esqueletos y luego las cuatro tarjetas KPI', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelectorAll('[data-testid^="kpi-"]')).toHaveLength(0);

    loadDashboard(fixture);

    expect(host.querySelectorAll('[data-testid^="kpi-"]')).toHaveLength(4);
    expect(host.querySelector('[data-testid="kpi-visitas"]')?.textContent).toContain('28');
    expect(host.querySelector('[data-testid="kpi-entregas"]')?.textContent).toContain('24');
    expect(host.querySelector('[data-testid="order-row"]')).not.toBeNull();
  });

  it('debe filtrar pedidos y clientes con el selector de zona', async () => {
    const fixture = await setup();
    loadDashboard(fixture);
    const host = fixture.nativeElement as HTMLElement;
    const select = host.querySelector('[data-testid="logistica-zone-select"]') as HTMLSelectElement;

    select.value = 'Centro';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(host.querySelectorAll('[data-testid="order-row"]')).toHaveLength(2);
    expect(host.querySelectorAll('[data-testid="client-row"]')).toHaveLength(2);
  });

  it('debe cambiar la jornada con el selector de fecha', async () => {
    const fixture = await setup();
    loadDashboard(fixture);
    const host = fixture.nativeElement as HTMLElement;
    const select = host.querySelector('[data-testid="logistica-date-select"]') as HTMLSelectElement;

    select.value = 'Mañana, 20 de octubre de 2026';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(fixture.componentInstance.store.dateLabel()).toBe('Mañana, 20 de octubre de 2026');
  });

  it('debe aplicar el SEO del tablero y restaurarlo al salir (R-UX-6)', async () => {
    const fixture = await setup();

    expect(seo.setPage).toHaveBeenCalledWith(
      'Logística',
      expect.stringContaining('rutas y entregas'),
    );

    fixture.destroy();
    expect(seo.reset).toHaveBeenCalled();
  });
});
