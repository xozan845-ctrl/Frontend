import { Component, computed, input } from '@angular/core';
import { KPI_TONE_CLASSES } from '../../constants/logistica.constants';
import { KpiTone } from '../../models/logistica.model';

/**
 * Tarjeta de resumen del tablero (presentacional, `R-SO-8`): recibe etiqueta,
 * valor, pista, icono y tono; no conoce el store ni calcula nada del dominio.
 */
@Component({
  selector: 'app-logistica-kpi-card',
  standalone: true,
  templateUrl: './kpi-card.component.html',
})
export class KpiCardComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly hint = input('');
  readonly icon = input.required<string>();
  readonly tone = input<KpiTone>('blue');
  readonly testId = input('');

  protected readonly toneClasses = computed(() => KPI_TONE_CLASSES[this.tone()]);
}
