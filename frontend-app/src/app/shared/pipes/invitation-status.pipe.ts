import { Pipe, PipeTransform } from '@angular/core';

/**
 * Traduce el estado de una invitación a una etiqueta legible o a las clases
 * Tailwind del chip. Evita evaluar métodos del componente en la plantilla
 * (`R-PF-4`).
 */
@Pipe({
  name: 'invitationStatus',
  standalone: true,
})
export class InvitationStatusPipe implements PipeTransform {
  transform(status: string, mode: 'label' | 'class' = 'label'): string {
    return mode === 'class' ? this.classFor(status) : this.labelFor(status);
  }

  private labelFor(status: string): string {
    switch (status) {
      case 'pendiente':
        return 'Pendiente';
      case 'aceptada':
        return 'Aceptada';
      case 'expirada':
        return 'Expirada';
      case 'revocada':
        return 'Revocada';
      default:
        return status || 'Sin estado';
    }
  }

  private classFor(status: string): string {
    switch (status) {
      case 'pendiente':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
      case 'aceptada':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
      case 'expirada':
        return 'bg-slate-200 text-slate-600 dark:bg-surface-700 dark:text-slate-300';
      case 'revocada':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-slate-100 text-slate-600 dark:bg-surface-700 dark:text-slate-300';
    }
  }
}
