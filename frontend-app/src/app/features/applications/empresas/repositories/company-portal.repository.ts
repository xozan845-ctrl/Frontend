import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { createOrdersDataSourceToken } from '../../../../shared/orders/repositories/orders-data-source/orders-data-source.repository';
import type { OrderResponse } from '../../cart/public-api';
import { CompanySalesAccount } from '../models/company-sales.model';
import { CompanyStore } from '../models/company-store.model';

export interface CompanyOrderFilters {
  storeId?: string;
  status?: string;
  limit?: number;
}

/** Puerto del portal de empresa (`/orders/empresa`, ventas y tiendas). */
export interface CompanyPortalRepository {
  orders(filters?: CompanyOrderFilters): Observable<OrderResponse[]>;
  sales(): Observable<CompanySalesAccount>;
  stores(): Observable<CompanyStore[]>;
}

export const COMPANY_PORTAL_REPOSITORY = new InjectionToken<CompanyPortalRepository>(
  'CompanyPortalRepository',
);

/** Fuente de órdenes de empresa para el store compartido `withOrders` (ADR-62). */
export const COMPANY_ORDERS_SOURCE =
  createOrdersDataSourceToken<OrderResponse>('CompanyOrdersSource');
