/** Estados de entrega que pinta el tablero de logística. */
export type DeliveryStatus = 'entregado' | 'en_ruta' | 'pendiente' | 'incidencia';

/** Estado del repartidor en el turno. */
export type CourierStatus = 'en_ruta' | 'retraso' | 'disponible';

/** Tono visual de una ruta; mapea a color, punto y chip en `constants/`. */
export type RouteTone = 'blue' | 'green' | 'amber' | 'red';

/** Tono visual de una tarjeta KPI. */
export type KpiTone = 'blue' | 'green' | 'amber' | 'emerald';

/** Tarjeta de resumen del encabezado del tablero. */
export interface DashboardKpi {
  id: string;
  label: string;
  value: string;
  hint: string;
  icon: string;
  tone: KpiTone;
  testId: string;
}

/** Segmento del donut "Estado de entregas". */
export interface DeliverySegment {
  status: DeliveryStatus;
  label: string;
  count: number;
  percent: number;
  tone: RouteTone;
}

/** Repartidor activo del día. */
export interface Courier {
  id: string;
  name: string;
  initials: string;
  routeLabel: string;
  zone: string;
  delivered: number;
  total: number;
  status: CourierStatus;
}

/** Parada numerada de una ruta en el mapa. */
export interface MapStop {
  lat: number;
  lng: number;
  order: number;
}

/** Ruta dibujada en el mapa con su color y sus paradas. */
export interface MapRoute {
  id: string;
  label: string;
  tone: RouteTone;
  color: string;
  stops: readonly MapStop[];
}

/** Vehículo en movimiento sobre el mapa. */
export interface MapVehicle {
  id: string;
  label: string;
  tone: RouteTone;
  lat: number;
  lng: number;
}

/** Fila de la tabla "Pedidos en ruta". */
export interface RouteOrder {
  id: string;
  client: string;
  address: string;
  zone: string;
  routeLabel: string;
  tone: RouteTone;
  status: DeliveryStatus;
  eta: string;
}

/** Fila de la tabla "Clientes del día". */
export interface ClientOfDay {
  id: number;
  name: string;
  zone: string;
  address: string;
  phone: string;
  routeNumber: number;
  tone: RouteTone;
}

/** Progreso de entregas de un repartidor, acotado a 0–100 (`R-RB-1`). */
export function courierProgress(courier: Courier): number {
  if (courier.total <= 0) return 0;
  return Math.min(100, Math.round((courier.delivered / courier.total) * 100));
}
