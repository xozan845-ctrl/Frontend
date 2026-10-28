import type { DeliverySegment } from '../../models/logistica.model';

export interface DonutArc extends DeliverySegment {
  color: string;
  dash: string;
  offset: number;
}
