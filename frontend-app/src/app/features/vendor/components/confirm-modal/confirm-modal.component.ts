import { Component, input, output } from '@angular/core';
import { FocusTrapDirective } from '../../../../shared/directives/focus-trap.directive';

/**
 * Confirmación accesible del panel (`R-AC-3`, `R-UX-4`): modal con
 * `focus-trap`, Escape y Cancelar. Presentacional: el contenedor decide qué
 * hacer al confirmar y comunica el progreso con `working`.
 */
@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [FocusTrapDirective],
  templateUrl: './confirm-modal.component.html',
})
export class ConfirmModalComponent {
  readonly open = input(false);
  readonly title = input.required<string>();
  readonly message = input.required<string>();
  readonly confirmLabel = input('Confirmar');
  readonly working = input(false);
  /** Tono del botón de confirmación; `danger` para acciones destructivas. */
  readonly tone = input<'primary' | 'danger'>('primary');
  readonly confirmed = output<void>();
  readonly dismissed = output<void>();

  confirm(): void {
    if (this.working()) return;
    this.confirmed.emit();
  }
}
