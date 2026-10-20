import { TestBed } from '@angular/core/testing';
import { MapRoute, MapVehicle } from '../../models/logistica.model';
import { LEAFLET_API, LeafletApi } from '../../services/leaflet-api.port';
import MapPanelComponent from './map-panel.component';

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

  const api = {
    map: vi.fn(() => mapInstance),
    tileLayer: vi.fn(() => ({ addTo: vi.fn() })),
    polyline: vi.fn(() => ({ addTo: vi.fn() })),
    marker: vi.fn(() => markerInstance),
    divIcon: vi.fn(() => ({})),
    layerGroup: vi.fn(() => layerGroupInstance),
    control: { attribution: vi.fn(() => ({ addTo: vi.fn() })) },
  };

  return { api, mapInstance, layerGroupInstance, markerInstance };
}

const routes: readonly MapRoute[] = [
  {
    id: 'ruta-1',
    label: 'Ruta 1',
    tone: 'blue',
    color: '#0055ff',
    stops: [
      { lat: 12.15, lng: -86.32, order: 1 },
      { lat: 12.14, lng: -86.29, order: 2 },
    ],
  },
  {
    id: 'ruta-2',
    label: 'Ruta 2',
    tone: 'green',
    color: '#22c55e',
    stops: [
      { lat: 12.16, lng: -86.25, order: 1 },
      { lat: 12.15, lng: -86.21, order: 2 },
    ],
  },
  {
    id: 'ruta-3',
    label: 'Ruta 3',
    tone: 'amber',
    color: '#f59e0b',
    stops: [{ lat: 12.11, lng: -86.17, order: 1 }],
  },
  {
    id: 'ruta-4',
    label: 'Ruta 4',
    tone: 'red',
    color: '#ef4444',
    stops: [{ lat: 12.08, lng: -86.23, order: 1 }],
  },
];

const vehicles: readonly MapVehicle[] = [
  { id: 'v-1', label: 'Ruta 1', tone: 'blue', lat: 12.13, lng: -86.3 },
];

describe('MapPanelComponent', () => {
  let leaflet: ReturnType<typeof createLeafletMock>;

  const setup = async (loading = false) => {
    await TestBed.configureTestingModule({
      imports: [MapPanelComponent],
      providers: [{ provide: LEAFLET_API, useValue: leaflet.api as unknown as LeafletApi }],
    }).compileComponents();
    const fixture = TestBed.createComponent(MapPanelComponent);
    fixture.componentRef.setInput('routes', routes);
    fixture.componentRef.setInput('vehicles', vehicles);
    fixture.componentRef.setInput('loading', loading);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => {
    TestBed.resetTestingModule();
    leaflet = createLeafletMock();
  });

  it('debe inicializar Leaflet con las teselas de OpenStreetMap (R-SE-7)', async () => {
    await setup();

    expect(leaflet.api.map).toHaveBeenCalledTimes(1);
    expect(leaflet.api.tileLayer).toHaveBeenCalledWith(
      'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      expect.objectContaining({ attribution: '&copy; OpenStreetMap' }),
    );
  });

  it('debe dibujar una polilínea por ruta y un marcador por parada y vehículo', async () => {
    await setup();

    expect(leaflet.api.polyline).toHaveBeenCalledTimes(4);
    expect(leaflet.api.polyline).toHaveBeenCalledWith(
      [
        [12.15, -86.32],
        [12.14, -86.29],
      ],
      expect.objectContaining({ color: '#0055ff' }),
    );
    expect(leaflet.api.marker).toHaveBeenCalledTimes(7);
  });

  it('debe mostrar la leyenda con todas las rutas', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelectorAll('ul[aria-label="Leyenda de rutas"] li')).toHaveLength(4);
    expect(host.textContent).toContain('Ruta 4');
  });

  it('debe conectar los controles de zoom y centrado con el mapa', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;

    (host.querySelector('[data-testid="map-zoom-in"]') as HTMLButtonElement).click();
    (host.querySelector('[data-testid="map-zoom-out"]') as HTMLButtonElement).click();
    (host.querySelector('[data-testid="map-center"]') as HTMLButtonElement).click();

    expect(leaflet.mapInstance.zoomIn).toHaveBeenCalledTimes(1);
    expect(leaflet.mapInstance.zoomOut).toHaveBeenCalledTimes(1);
    expect(leaflet.mapInstance.setView).toHaveBeenCalledWith([12.128, -86.245], 12);
  });

  it('debe mostrar el aviso de carga sobre el mapa', async () => {
    const fixture = await setup(true);
    const host = fixture.nativeElement as HTMLElement;

    expect(host.textContent).toContain('Cargando rutas…');
  });

  it('debe liberar el mapa al destruir el panel (R-AR-10)', async () => {
    const fixture = await setup();
    fixture.destroy();

    expect(leaflet.mapInstance.remove).toHaveBeenCalledTimes(1);
  });
});
