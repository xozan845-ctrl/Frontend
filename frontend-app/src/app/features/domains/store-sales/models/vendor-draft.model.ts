import type { OrderDraft } from './vendor-order.model';

/** Identidad que aísla un borrador del POS: empresa, tienda y usuario (`R-ST-7`). */
export interface VendorDraftScope {
  tenantId: string;
  storeId: string;
  userId: string;
}

/** Envoltorio persistido del borrador con versión y dueño (`R-ST-7`). */
export interface VendorDraftEnvelope {
  version: number;
  owner: VendorDraftScope;
  draft: OrderDraft;
}
