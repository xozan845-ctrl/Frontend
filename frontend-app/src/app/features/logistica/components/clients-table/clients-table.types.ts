import type { ClientOfDay } from '../../models/logistica.model';

export interface ClientRow extends ClientOfDay {
  whatsappUrl: string;
}
