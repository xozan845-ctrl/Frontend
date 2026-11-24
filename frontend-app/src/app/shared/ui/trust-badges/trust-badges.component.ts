import { Component, input } from '@angular/core';
import type { TrustBadge } from './trust-badges.types';

/**
 * Señales de confianza para páginas transaccionales.
 *
 * El componente es presentacional: no inyecta stores de negocio y solo muestra
 * los beneficios que el contexto le entrega por `input` (R-SH-4).
 */
@Component({
  selector: 'app-trust-badges',
  standalone: true,
  templateUrl: './trust-badges.component.html',
})
export class TrustBadgesComponent {
  readonly badges = input<readonly TrustBadge[]>([]);
  readonly compact = input(false);
}
