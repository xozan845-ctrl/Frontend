/** Venta consolidada de la empresa (`VentaEmpresaResponseDto`). */
export interface CompanySale {
  orderId: string;
  sale: number;
  commission: number;
  companyAmount: number;
  status: string;
  date: string;
}

/** Estado de cuenta de la empresa (`EstadoCuentaEmpresaResponseDto`). */
export interface CompanySalesAccount {
  companyId: string;
  sales: CompanySale[];
  pendingCommissions: number;
}

export interface CompanySalesSummary {
  totalSales: number;
  totalCommission: number;
  totalCompanyAmount: number;
  salesCount: number;
}
