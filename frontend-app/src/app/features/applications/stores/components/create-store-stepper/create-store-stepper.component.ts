import { Component, input } from '@angular/core';
import { NgClass } from '@angular/common';
import { WizardStep } from '../../models/store-wizard.model';

/**
 * Indicador de progreso del asistente (presentacional, R-SO-8): recibe los pasos
 * y el actual; no conoce stores ni servicios de dominio.
 */
@Component({
  selector: 'app-create-store-stepper',
  standalone: true,
  imports: [NgClass],
  templateUrl: './create-store-stepper.component.html',
})
export class CreateStoreStepperComponent {
  steps = input.required<readonly WizardStep[]>();
  current = input.required<number>();
}
