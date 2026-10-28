/** Empresa logística independiente de cualquier tenant comercial. */
export interface LogisticsCompany {
  id: string;
  name: string;
  slug?: string;
  status: string;
  createdAt: string;
}

export interface CreateLogisticsCompanyData {
  name: string;
  slug?: string;
}
