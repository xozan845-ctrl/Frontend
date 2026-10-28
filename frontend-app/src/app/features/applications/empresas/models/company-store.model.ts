/** Tienda consolidada de la empresa (`TiendaResponseDto`). */
export interface CompanyStore {
  id: string;
  companyId: string;
  ownerUserId: string;
  sellerId: string;
  name: string;
  description: string;
  participationPercentage: number;
  createdAt: string;
}
