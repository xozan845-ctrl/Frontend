import { Component, input, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SpinnerComponent } from '../spinner/spinner.component';

type EmptyStateVariant = 'default' | 'error' | 'loading' | 'empty' | 'no-results';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [RouterLink, SpinnerComponent],
  templateUrl: './empty-state.component.html',
})
export class EmptyStateComponent {
  icon = input<string>('fa-solid fa-box-open');
  title = input<string>('Sin resultados');
  subtitle = input<string>('No hay elementos para mostrar.');
  actionLabel = input<string>('');
  actionRoute = input<string>('');
  actionClick = input<(() => void) | null>(null);
  variant = input<EmptyStateVariant>('default');

  iconContainerClasses = computed(() => {
    const base = 'w-28 h-28 rounded-full flex items-center justify-center shadow-inner';
    switch (this.variant()) {
      case 'error':
        return `${base} bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/10`;
      case 'empty':
        return `${base} bg-gradient-to-br from-slate-100 to-slate-200 dark:from-surface-800 dark:to-surface-700`;
      case 'no-results':
        return `${base} bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10`;
      default:
        return `${base} bg-gradient-to-br from-slate-100 to-slate-200 dark:from-surface-800 dark:to-surface-700`;
    }
  });

  iconClasses = computed(() => {
    switch (this.variant()) {
      case 'error':
        return 'text-red-400 dark:text-red-500';
      case 'empty':
        return 'text-slate-300 dark:text-surface-600';
      case 'no-results':
        return 'text-blue-400 dark:text-blue-500';
      default:
        return 'text-slate-300 dark:text-surface-600';
    }
  });

  dot1Class = computed(() => {
    switch (this.variant()) {
      case 'error':
        return 'bg-red-200 dark:bg-red-800';
      case 'no-results':
        return 'bg-blue-200 dark:bg-blue-800';
      default:
        return 'bg-accent-100 dark:bg-accent-900/40';
    }
  });

  dot2Class = computed(() => {
    switch (this.variant()) {
      case 'error':
        return 'bg-red-300 dark:bg-red-700';
      case 'no-results':
        return 'bg-blue-300 dark:bg-blue-700';
      default:
        return 'bg-slate-200 dark:bg-surface-600';
    }
  });

  titleClasses = computed(() => {
    switch (this.variant()) {
      case 'error':
        return 'text-red-600 dark:text-red-400';
      case 'empty':
        return 'text-slate-700 dark:text-slate-300';
      case 'no-results':
        return 'text-blue-600 dark:text-blue-400';
      default:
        return 'text-slate-700 dark:text-slate-300';
    }
  });

  subtitleClasses = computed(() => {
    switch (this.variant()) {
      case 'error':
        return 'text-red-500 dark:text-red-400';
      case 'empty':
        return 'text-slate-500 dark:text-slate-400';
      case 'no-results':
        return 'text-blue-500 dark:text-blue-400';
      default:
        return 'text-slate-500 dark:text-slate-400';
    }
  });

  actionButtonClasses = computed(() => {
    switch (this.variant()) {
      case 'error':
        return 'bg-red-600 hover:bg-red-700 shadow-red-600/25';
      case 'empty':
        return 'bg-accent-600 hover:bg-accent-700 shadow-accent-600/25';
      case 'no-results':
        return 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/25';
      default:
        return 'bg-accent-600 hover:bg-accent-700 shadow-accent-600/25';
    }
  });
}
