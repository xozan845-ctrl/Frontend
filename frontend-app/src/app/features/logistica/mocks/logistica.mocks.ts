import {
  ClientOfDay,
  Courier,
  DashboardKpi,
  DeliverySegment,
  MapRoute,
  MapVehicle,
  RouteOrder,
} from '../models/logistica.model';

/**
 * Datos del tablero de logística mientras el backend no exponga los endpoints
 * de rutas, repartidores y entregas. Los valores replican el boceto aprobado
 * (ADR-25); un cambio de contrato se registra como ADR antes de tocarlos.
 */
export const LOGISTICA_KPIS: readonly DashboardKpi[] = [
  {
    id: 'visits',
    label: 'Clientes por visitar',
    value: '28',
    hint: 'de 42 programados',
    icon: 'fa-solid fa-user-group',
    tone: 'blue',
    testId: 'kpi-visitas',
  },
  {
    id: 'routes',
    label: 'Rutas activas',
    value: '5',
    hint: 'de 6 programadas',
    icon: 'fa-solid fa-route',
    tone: 'green',
    testId: 'kpi-rutas',
  },
  {
    id: 'transit',
    label: 'Pedidos en tránsito',
    value: '18',
    hint: 'en ruta actualmente',
    icon: 'fa-solid fa-box',
    tone: 'amber',
    testId: 'kpi-transito',
  },
  {
    id: 'delivered',
    label: 'Entregas completadas',
    value: '24',
    hint: 'de 42 programados (57%)',
    icon: 'fa-solid fa-circle-check',
    tone: 'emerald',
    testId: 'kpi-entregas',
  },
];

export const LOGISTICA_DELIVERY: readonly DeliverySegment[] = [
  { status: 'entregado', label: 'Entregados', count: 24, percent: 57, tone: 'green' },
  { status: 'en_ruta', label: 'En ruta', count: 18, percent: 43, tone: 'blue' },
  { status: 'pendiente', label: 'Pendientes', count: 6, percent: 14, tone: 'amber' },
  { status: 'incidencia', label: 'Incidencias', count: 4, percent: 10, tone: 'red' },
];

export const LOGISTICA_COURIERS: readonly Courier[] = [
  {
    id: 'carlos-mendoza',
    name: 'Carlos Mendoza',
    initials: 'CM',
    routeLabel: 'Ruta 1',
    zone: 'Zona Centro',
    delivered: 4,
    total: 8,
    status: 'en_ruta',
  },
  {
    id: 'laura-gutierrez',
    name: 'Laura Gutiérrez',
    initials: 'LG',
    routeLabel: 'Ruta 2',
    zone: 'Zona Norte',
    delivered: 6,
    total: 8,
    status: 'en_ruta',
  },
  {
    id: 'diego-ramos',
    name: 'Diego Ramos',
    initials: 'DR',
    routeLabel: 'Ruta 3',
    zone: 'Zona Este',
    delivered: 3,
    total: 7,
    status: 'retraso',
  },
  {
    id: 'andres-lopez',
    name: 'Andrés López',
    initials: 'AL',
    routeLabel: 'Ruta 4',
    zone: 'Zona Sur',
    delivered: 5,
    total: 6,
    status: 'disponible',
  },
];

export const LOGISTICA_ORDERS: readonly RouteOrder[] = [
  {
    id: 'P-1001',
    client: 'María López',
    address: 'Col. Centroamérica, Managua',
    zone: 'Centro',
    routeLabel: 'Ruta 1',
    tone: 'blue',
    status: 'en_ruta',
    eta: '10:30 a.m.',
  },
  {
    id: 'P-1002',
    client: 'Distribuidora Rivas',
    address: 'Cd. Sandino, Calle Principal',
    zone: 'Norte',
    routeLabel: 'Ruta 2',
    tone: 'green',
    status: 'en_ruta',
    eta: '11:15 a.m.',
  },
  {
    id: 'P-1003',
    client: 'Juan Pérez',
    address: 'Barrio Santo Domingo',
    zone: 'Este',
    routeLabel: 'Ruta 3',
    tone: 'amber',
    status: 'pendiente',
    eta: '12:00 p.m.',
  },
  {
    id: 'P-1004',
    client: 'Clínica Vida',
    address: 'Altamira, Managua',
    zone: 'Centro',
    routeLabel: 'Ruta 1',
    tone: 'blue',
    status: 'en_ruta',
    eta: '11:45 a.m.',
  },
  {
    id: 'P-1005',
    client: 'Ana Torres',
    address: 'Las Colinas',
    zone: 'Sur',
    routeLabel: 'Ruta 4',
    tone: 'red',
    status: 'incidencia',
    eta: '12:20 p.m.',
  },
];

export const LOGISTICA_CLIENTS: readonly ClientOfDay[] = [
  {
    id: 1,
    name: 'María López',
    zone: 'Centro',
    address: 'Col. Centroamérica',
    phone: '+50588880001',
    routeNumber: 1,
    tone: 'blue',
  },
  {
    id: 2,
    name: 'Distribuidora Rivas',
    zone: 'Norte',
    address: 'Cd. Sandino',
    phone: '+50588880002',
    routeNumber: 2,
    tone: 'green',
  },
  {
    id: 3,
    name: 'Juan Pérez',
    zone: 'Este',
    address: 'B. Santo Domingo',
    phone: '+50588880003',
    routeNumber: 3,
    tone: 'amber',
  },
  {
    id: 4,
    name: 'Clínica Vida',
    zone: 'Centro',
    address: 'Altamira',
    phone: '+50588880004',
    routeNumber: 1,
    tone: 'blue',
  },
  {
    id: 5,
    name: 'Ana Torres',
    zone: 'Sur',
    address: 'Las Colinas',
    phone: '+50588880005',
    routeNumber: 4,
    tone: 'red',
  },
];

/** Recorridos del boceto sobre el área metropolitana de Managua. */
export const LOGISTICA_ROUTES: readonly MapRoute[] = [
  {
    id: 'ruta-1',
    label: 'Ruta 1',
    tone: 'blue',
    color: '#0055ff',
    stops: [
      { lat: 12.155, lng: -86.32, order: 1 },
      { lat: 12.148, lng: -86.306, order: 2 },
      { lat: 12.138, lng: -86.292, order: 3 },
      { lat: 12.129, lng: -86.279, order: 4 },
      { lat: 12.131, lng: -86.266, order: 5 },
    ],
  },
  {
    id: 'ruta-2',
    label: 'Ruta 2',
    tone: 'green',
    color: '#22c55e',
    stops: [
      { lat: 12.162, lng: -86.254, order: 1 },
      { lat: 12.169, lng: -86.24, order: 2 },
      { lat: 12.166, lng: -86.226, order: 3 },
      { lat: 12.154, lng: -86.214, order: 4 },
      { lat: 12.147, lng: -86.202, order: 5 },
    ],
  },
  {
    id: 'ruta-3',
    label: 'Ruta 3',
    tone: 'amber',
    color: '#f59e0b',
    stops: [
      { lat: 12.143, lng: -86.174, order: 1 },
      { lat: 12.13, lng: -86.168, order: 2 },
      { lat: 12.115, lng: -86.172, order: 3 },
      { lat: 12.103, lng: -86.162, order: 4 },
    ],
  },
  {
    id: 'ruta-4',
    label: 'Ruta 4',
    tone: 'red',
    color: '#ef4444',
    stops: [
      { lat: 12.1, lng: -86.244, order: 1 },
      { lat: 12.088, lng: -86.232, order: 2 },
      { lat: 12.076, lng: -86.219, order: 3 },
      { lat: 12.085, lng: -86.205, order: 4 },
    ],
  },
];

export const LOGISTICA_VEHICLES: readonly MapVehicle[] = [
  { id: 'vehiculo-1', label: 'Ruta 1', tone: 'blue', lat: 12.134, lng: -86.298 },
  { id: 'vehiculo-3', label: 'Ruta 3', tone: 'amber', lat: 12.15, lng: -86.18 },
  { id: 'vehiculo-4', label: 'Ruta 4', tone: 'red', lat: 12.08, lng: -86.228 },
];
