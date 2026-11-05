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
        return 'badge-warning';
      case 'aceptada':
        return 'badge-success';
      case 'expirada':
        return 'badge-neutral';
      case 'revocada':
        return 'badge-danger';
      default:
        return 'badge-neutral';
    }
  }
}
