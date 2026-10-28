import { CourierStatus, DeliveryStatus, KpiTone, RouteTone } from '../models/logistica.model';

/** Zona comodín: no filtra (equivale a "Todas las zonas"). */
export const ALL_ZONES = 'Todas las zonas';

/** Zonas del tablero para el filtro del encabezado. */
export const LOGISTICA_ZONES: readonly string[] = [ALL_ZONES, 'Centro', 'Norte', 'Este', 'Sur'];

/** Jornadas disponibles en el selector de fecha. */
export const LOGISTICA_DATES: readonly string[] = [
  'Hoy, 19 de octubre de 2026',
  'Mañana, 20 de octubre de 2026',
  'Ayer, 18 de octubre de 2026',
];

/** Latencia simulada de la carga del tablero mientras no hay backend. */
export const LOGISTICA_LOAD_DELAY_MS = 450;

/**
 * Pedidos programados del día (boceto). Es el total que muestra el centro del
 * donut; los conteos por estado del boceto se solapan y no suman este valor.
 */
export const LOGISTICA_DELIVERY_TOTAL = 42;

/** Centro y zoom iniciales del mapa de Managua. */
export const LOGISTICA_MAP_VIEW = { lat: 12.128, lng: -86.245, zoom: 12 } as const;

/** Origen de las teselas del mapa (`R-SE-7`: proveedor justificado en el PR). */
export const LOGISTICA_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

/** Atribución obligatoria de OpenStreetMap. */
export const LOGISTICA_TILE_ATTRIBUTION = '&copy; OpenStreetMap';

/** Estilo por tono de ruta: punto, badge numerado, texto y color del mapa. */
export const ROUTE_TONE_CLASSES: Record<
  RouteTone,
  { dot: string; badge: string; text: string; hex: string }
> = {
  blue: {
    dot: 'bg-accent-600',
    badge: 'bg-accent-600 text-white',
    text: 'text-accent-600 dark:text-accent-400',
    hex: '#0055ff',
  },
  green: {
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-500 text-white',
    text: 'text-emerald-600 dark:text-emerald-400',
    hex: '#22c55e',
  },
  amber: {
    dot: 'bg-amber-500',
    badge: 'bg-amber-500 text-white',
    text: 'text-amber-600 dark:text-amber-400',
    hex: '#f59e0b',
  },
  red: {
    dot: 'bg-red-500',
    badge: 'bg-red-500 text-white',
    text: 'text-red-600 dark:text-red-400',
    hex: '#ef4444',
  },
};

/** Chip por estado de entrega. */
export const DELIVERY_STATUS_CLASSES: Record<DeliveryStatus, string> = {
  entregado: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  en_ruta: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  pendiente: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  incidencia: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

/** Etiqueta legible de cada estado de entrega. */
export const DELIVERY_STATUS_LABELS: Record<DeliveryStatus, string> = {
  entregado: 'Entregados',
  en_ruta: 'En ruta',
  pendiente: 'Pendientes',
  incidencia: 'Incidencias',
};

/** Chip y etiqueta por estado del repartidor. */
export const COURIER_STATUS_META: Record<
  CourierStatus,
  { label: string; chip: string; bar: string }
> = {
  en_ruta: {
    label: 'En ruta',
    chip: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    bar: 'bg-accent-600',
  },
  retraso: {
    label: 'Retraso',
    chip: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    bar: 'bg-amber-500',
  },
  disponible: {
    label: 'Disponible',
    chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    bar: 'bg-emerald-500',
  },
};

/** Fondo, icono, borde y flecha por tono de tarjeta KPI. */
export const KPI_TONE_CLASSES: Record<KpiTone, { card: string; icon: string; chevron: string }> = {
  blue: {
    card: 'border-blue-100 bg-blue-50/50 dark:border-surface-700 dark:bg-surface-800',
    icon: 'bg-blue-100 text-accent-600 dark:bg-accent-900/30 dark:text-accent-400',
    chevron: 'bg-blue-100 text-blue-500 dark:bg-accent-900/30 dark:text-accent-400',
  },
  green: {
    card: 'border-emerald-100 bg-emerald-50/40 dark:border-surface-700 dark:bg-surface-800',
    icon: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    chevron: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  amber: {
    card: 'border-amber-100 bg-amber-50/40 dark:border-surface-700 dark:bg-surface-800',
    icon: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    chevron: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  },
  emerald: {
    card: 'border-emerald-100 bg-emerald-50/40 dark:border-surface-700 dark:bg-surface-800',
    icon: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    chevron: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
};
