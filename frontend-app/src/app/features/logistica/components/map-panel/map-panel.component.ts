import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  computed,
  effect,
  inject,
  input,
  viewChild,
} from '@angular/core';
import type { LayerGroup, Map as LeafletMap } from 'leaflet';
import {
  LOGISTICA_MAP_VIEW,
  LOGISTICA_TILE_ATTRIBUTION,
  LOGISTICA_TILE_URL,
  ROUTE_TONE_CLASSES,
} from '../../constants/logistica.constants';
import { MapRoute, MapVehicle } from '../../models/logistica.model';
import { LEAFLET_API } from '../../services/leaflet-api';

/**
 * Mapa de clientes y rutas (ADR-25): dibuja las rutas del boceto sobre
 * OpenStreetMap con Leaflet. El CSS de Leaflet y su JS viven fuera del bundle
 * inicial (`R-LZ-1`, `R-PF-1`): el CSS se inyecta al montar el panel y la
 * librería viaja en el chunk de esta página lazy. La leyenda y los controles de
 * zoom son propios y accesibles (`R-AC-1`, `R-AC-2`).
 */
@Component({
  selector: 'app-logistica-map-panel',
  standalone: true,
  templateUrl: './map-panel.component.html',
})
export default class MapPanelComponent implements AfterViewInit, OnDestroy {
  readonly routes = input.required<readonly MapRoute[]>();
  readonly vehicles = input<readonly MapVehicle[]>([]);
  readonly loading = input(false);

  protected readonly toneClasses = ROUTE_TONE_CLASSES;
  protected readonly legend = computed(() => this.routes());

  private readonly leaflet = inject(LEAFLET_API);
  private readonly mapContainer = viewChild.required<ElementRef<HTMLDivElement>>('map');
  private map: LeafletMap | null = null;
  private layers: LayerGroup | null = null;

  constructor() {
    // Redibuja cuando llegan las rutas o cambian los vehículos.
    effect(() => {
      const routes = this.routes();
      const vehicles = this.vehicles();
      if (this.map && this.layers) {
        this.draw(routes, vehicles);
      }
    });
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnDestroy(): void {
    this.map?.remove();
    this.map = null;
    this.layers = null;
  }

  protected zoomIn(): void {
    this.map?.zoomIn();
  }

  protected zoomOut(): void {
    this.map?.zoomOut();
  }

  protected centerMap(): void {
    this.map?.setView([LOGISTICA_MAP_VIEW.lat, LOGISTICA_MAP_VIEW.lng], LOGISTICA_MAP_VIEW.zoom);
  }

  protected async toggleFullscreen(): Promise<void> {
    const wrapper = this.mapContainer().nativeElement.parentElement;
    if (!wrapper) return;

    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }

    await wrapper.requestFullscreen?.();
  }

  private initMap(): void {
    const host = this.mapContainer().nativeElement;
    if (this.map) return;

    this.loadLeafletStyles();
    const leaflet = this.leaflet;

    this.map = leaflet.map(host, {
      center: [LOGISTICA_MAP_VIEW.lat, LOGISTICA_MAP_VIEW.lng],
      zoom: LOGISTICA_MAP_VIEW.zoom,
      zoomControl: false,
      scrollWheelZoom: false,
      attributionControl: false,
    });

    leaflet
      .tileLayer(LOGISTICA_TILE_URL, {
        maxZoom: 19,
        attribution: LOGISTICA_TILE_ATTRIBUTION,
      })
      .addTo(this.map);

    leaflet.control.attribution({ position: 'bottomright', prefix: false }).addTo(this.map);
    this.layers = leaflet.layerGroup().addTo(this.map);
    this.draw(this.routes(), this.vehicles());
  }

  /**
   * Carga el CSS de Leaflet como asset al montar el panel: así no entra en el
   * bundle inicial ni exige una hoja de estilos global (`R-PF-1`, `R-LZ-1`).
   */
  private loadLeafletStyles(): void {
    if (document.querySelector('link[data-leaflet-styles]')) return;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'leaflet/leaflet.css';
    link.dataset['leafletStyles'] = 'true';
    document.head.appendChild(link);
  }

  /** Dibuja rutas y vehículos; limpia la capa anterior en cada actualización. */
  private draw(routes: readonly MapRoute[], vehicles: readonly MapVehicle[]): void {
    if (!this.map || !this.layers) return;

    const leaflet = this.leaflet;
    this.layers.clearLayers();

    for (const route of routes) {
      const points = route.stops.map((stop) => [stop.lat, stop.lng] as [number, number]);

      leaflet.polyline(points, { color: route.color, weight: 4, opacity: 0.9 }).addTo(this.layers);

      for (const stop of route.stops) {
        leaflet
          .marker([stop.lat, stop.lng], {
            keyboard: false,
            icon: leaflet.divIcon({
              className: 'logistica-stop',
              html: `<span style="display:flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:9999px;background:${route.color};color:#fff;font-size:11px;font-weight:800;line-height:1;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35)">${stop.order}</span>`,
              iconSize: [22, 22],
              iconAnchor: [11, 11],
            }),
          })
          .addTo(this.layers)
          .bindTooltip(`${route.label} · parada ${stop.order}`, { direction: 'top' });
      }
    }

    for (const vehicle of vehicles) {
      leaflet
        .marker([vehicle.lat, vehicle.lng], {
          keyboard: false,
          icon: leaflet.divIcon({
            className: 'logistica-vehicle',
            html: `<span style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:9px;background:${ROUTE_TONE_CLASSES[vehicle.tone].hex};color:#fff;font-size:13px;line-height:1;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.4)"><i class="fa-solid fa-truck"></i></span>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          }),
        })
        .addTo(this.layers)
        .bindTooltip(`${vehicle.label} · en reparto`, { direction: 'top' });
    }
  }
}
