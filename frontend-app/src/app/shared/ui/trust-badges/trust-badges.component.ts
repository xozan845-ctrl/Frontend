import { Component } from '@angular/core';

interface TrustBadge {
  icon: string;
  title: string;
  subtitle: string;
  color: string;
}

@Component({
  selector: 'app-trust-badges',
  standalone: true,
  templateUrl: './trust-badges.component.html',
})
export class TrustBadgesComponent {
  badges: TrustBadge[] = [
    {
      icon: 'fa-solid fa-lock',
      title: 'SSL Seguro',
      subtitle: 'Encriptación 256-bit',
      color: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    },
    {
      icon: 'fa-solid fa-truck-fast',
      title: 'Envío Gratis',
      subtitle: 'En pedidos +$50',
      color: 'bg-accent-50 dark:bg-accent-900/20 text-accent-600 dark:text-accent-400',
    },
    {
      icon: 'fa-solid fa-rotate-left',
      title: 'Garantía 30d',
      subtitle: 'Devolución sin costo',
      color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
    },
    {
      icon: 'fa-solid fa-headset',
      title: 'Soporte 24/7',
      subtitle: 'Chat y teléfono',
      color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    },
  ];
}
