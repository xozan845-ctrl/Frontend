import type {
  ClientOfDay,
  Courier,
  DeliverySegment,
  MapRoute,
  MapVehicle,
  RouteOrder,
} from '../../models/logistica.model';

export interface LogisticaDashboardState {
  loading: boolean;
  zoneFilter: string;
  dateLabel: string;
  delivery: readonly DeliverySegment[];
  deliveryTotal: number;
  couriers: readonly Courier[];
  orders: readonly RouteOrder[];
  clients: readonly ClientOfDay[];
  routes: readonly MapRoute[];
  vehicles: readonly MapVehicle[];
}
