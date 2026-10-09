import { Component, computed, input } from '@angular/core';

const BASE =
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide';

const TONES: Record<string, string> = {
  COMPLETED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  READY: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  FAILED: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  TIMEOUT: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  CANCELLED: 'bg-slate-200 text-slate-600 dark:bg-surface-700 dark:text-slate-300',
  QUEUED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  RADIOGRAPHY: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
};

const DEFAULT_TONE = 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';

/** Insignia de estado de un job/sesión del backend de IA (`R-SO-6`). */
@Component({
  selector: 'app-ai-status-badge',
  templateUrl: './ai-status-badge.component.html',
})
export class AiStatusBadgeComponent {
  readonly status = input.required<string>();
  readonly classes = computed(() => `${BASE} ${TONES[this.status()] ?? DEFAULT_TONE}`);
}
