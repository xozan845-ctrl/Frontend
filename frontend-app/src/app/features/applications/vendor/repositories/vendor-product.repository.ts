import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { VendorProduct } from '../models/vendor-order.model';

/** Puerto del catálogo propio del vendedor (Core Engine, contrato asumido ADR-20). */
export interface VendorProductRepository {
  /** Productos del vendedor para el POS (`GET /vendedores/me/productos`). */
  listVendorProducts(): Observable<VendorProduct[]>;
}

export const VENDOR_PRODUCT_REPOSITORY = new InjectionToken<VendorProductRepository>(
  'VendorProductRepository',
);
