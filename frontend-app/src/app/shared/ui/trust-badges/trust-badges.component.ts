import { Component, input } from '@angular/core';
import type { TrustBadge } from './trust-badges.types';

export const DEFAULT_TRUST_BADGES: readonly TrustBadge[] = [
  {
    icon: 'fa-solid fa-shield-halved',
    title: 'Pago Seguro',
    subtitle: 'Datos encriptados',
  },
  {
    icon: 'fa-solid fa-rotate-left',
    title: '30 Días Retorno',
    subtitle: 'Devolución sin costo',
  },
  {
    icon: 'fa-solid fa-truck-fast',
    title: 'Envío Global',
    subtitle: 'Cobertura internacional',
  },
  {
    icon: 'fa-solid fa-headset',
    title: 'Soporte 24/7',
    subtitle: 'Chat y teléfono',
  },
];

/** Señales de confianza para páginas transaccionales. */
@Component({
  selector: 'app-trust-badges',
  standalone: true,
  templateUrl: './trust-badges.component.html',
})
export class TrustBadgesComponent {
  readonly badges = input<readonly TrustBadge[]>(DEFAULT_TRUST_BADGES);
  readonly compact = input(false);
}
