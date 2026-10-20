import { Component, computed, input } from '@angular/core';
import { ROUTE_TONE_CLASSES } from '../../constants/logistica.constants';
import { ClientOfDay } from '../../models/logistica.model';

interface ClientRow extends ClientOfDay {
  whatsappUrl: string;
}

/** Construye el enlace de WhatsApp a partir del teléfono (`R-SE-7`). */
export function whatsappUrl(phone: string): string {
  return `https://wa.me/${phone.replace(/\D/g, '')}`;
}

/** Tabla "Clientes del día" (presentacional, `R-SO-8`). */
@Component({
  selector: 'app-logistica-clients-table',
  standalone: true,
  templateUrl: './clients-table.component.html',
})
export class ClientsTableComponent {
  readonly clients = input.required<readonly ClientOfDay[]>();
  readonly loading = input(false);

  protected readonly routeTones = ROUTE_TONE_CLASSES;
  protected readonly skeletonRows = [1, 2, 3, 4, 5];

  protected readonly rows = computed<ClientRow[]>(() =>
    this.clients().map((client) => ({ ...client, whatsappUrl: whatsappUrl(client.phone) })),
  );
}
