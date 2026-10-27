import { Component, input, output } from '@angular/core';

/**
 * Stepper de cantidad del POS (presentacional, `R-SO-8`): −, valor y +, con
 * límites visibles y accesibles (`R-AC-1`). No conoce stores ni servicios;
 * emite el valor nuevo por `valueChange`.
 */
@Component({
  selector: 'app-quantity-stepper',
  standalone: true,
  templateUrl: './quantity-stepper.component.html',
})
export class QuantityStepperComponent {
  readonly value = input.required<number>();
  readonly min = input(1);
  readonly max = input(999);
  /** Nombre accesible del elemento sobre el que se ajusta la cantidad. */
  readonly label = input('cantidad');
  readonly valueChange = output<number>();

  decrement(): void {
    if (this.value() <= this.min()) return;
    this.valueChange.emit(this.value() - 1);
  }

  increment(): void {
    if (this.value() >= this.max()) return;
    this.valueChange.emit(this.value() + 1);
  }
}
