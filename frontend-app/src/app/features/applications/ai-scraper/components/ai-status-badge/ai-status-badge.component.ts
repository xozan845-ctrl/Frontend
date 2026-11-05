import { Component, computed, input } from '@angular/core';

const BASE =
  'badge inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide';

const TONES: Record<string, string> = {
  COMPLETED: 'badge-success',
  READY: 'badge-success',
  FAILED: 'badge-danger',
  TIMEOUT: 'badge-danger',
  CANCELLED: 'badge-neutral',
  QUEUED: 'badge-warning',
  RADIOGRAPHY: 'badge-primary',
};

const DEFAULT_TONE = 'badge-primary';

/** Insignia de estado de un job/sesión del backend de IA (`R-SO-6`). */
@Component({
  selector: 'app-ai-status-badge',
  templateUrl: './ai-status-badge.component.html',
})
export class AiStatusBadgeComponent {
  readonly status = input.required<string>();
  readonly classes = computed(() => `${BASE} ${TONES[this.status()] ?? DEFAULT_TONE}`);
}
