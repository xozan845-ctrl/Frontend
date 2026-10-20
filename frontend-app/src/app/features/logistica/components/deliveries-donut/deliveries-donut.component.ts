import { Component, computed, input } from '@angular/core';
import { ROUTE_TONE_CLASSES } from '../../constants/logistica.constants';
import { DeliverySegment, RouteTone } from '../../models/logistica.model';

interface DonutArc extends DeliverySegment {
  color: string;
  dash: string;
  offset: number;
}

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Donut "Estado de entregas" (presentacional, `R-SO-8`): normaliza los conteos
 * a un anillo completo y muestra la leyenda con los porcentajes del tablero.
 * El SVG lleva `role="img"` con un resumen textual (`R-AC-4`).
 */
@Component({
  selector: 'app-logistica-deliveries-donut',
  standalone: true,
  templateUrl: './deliveries-donut.component.html',
})
export class DeliveriesDonutComponent {
  readonly segments = input.required<readonly DeliverySegment[]>();
  readonly total = input(0);

  protected readonly radius = RADIUS;
  protected readonly circumference = CIRCUMFERENCE;
  protected readonly toneClasses = ROUTE_TONE_CLASSES;

  protected readonly arcs = computed<DonutArc[]>(() => {
    const segments = this.segments();
    const total = segments.reduce((sum, segment) => sum + segment.count, 0);
    let consumed = 0;

    return segments.map((segment) => {
      const length = total > 0 ? (segment.count / total) * CIRCUMFERENCE : 0;
      const arc: DonutArc = {
        ...segment,
        color: ROUTE_TONE_CLASSES[segment.tone].hex,
        dash: `${length} ${CIRCUMFERENCE - length}`,
        offset: -consumed,
      };
      consumed += length;
      return arc;
    });
  });

  protected readonly ariaLabel = computed(() => {
    const detail = this.segments()
      .map((segment) => `${segment.count} ${segment.label.toLowerCase()}`)
      .join(', ');
    return `Estado de entregas: ${this.total()} pedidos en total (${detail})`;
  });

  protected toneDot(tone: RouteTone): string {
    return ROUTE_TONE_CLASSES[tone].dot;
  }
}
