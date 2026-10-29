import { Route, Routes } from '@angular/router';
import {
  CATALOG_PRODUCT_REPOSITORY,
  CatalogProductService,
} from '../../applications/products/public-api';
import {
  COMPANY_ORDERS_SOURCE,
  COMPANY_PORTAL_REPOSITORY,
  CompanyPortalService,
  CompanySalesStore,
  createCompanyOrdersSource,
  type CompanyPortalRepository,
} from '../../applications/empresas/public-api';
import { COMPANY_BANKS_SCOPE_CONFIG } from '../../applications/empresas/constants/company-banks.config';
import { BANKS_SCOPE_CONFIG } from '../../../shared/banks/constants/banks-config.tokens';
import { BanksStore } from '../../domains/banks/public-api';
import { FinanceStore, type FinanceTab } from '../../domains/finance/public-api';

/**
 * La caja consume las ventas cobradas para construir el libro de movimientos.
 * Por eso la ruta provee el mismo store de ventas que `/empresa/ventas`, además
 * de `BanksStore` para la sección de bancos y transferencias.
 */
function financeRoute(tab: FinanceTab): Route {
  return {
    path: '',
    providers: [
      FinanceStore,
      BanksStore,
      CompanySalesStore,
      { provide: BANKS_SCOPE_CONFIG, useValue: COMPANY_BANKS_SCOPE_CONFIG },
      { provide: COMPANY_PORTAL_REPOSITORY, useClass: CompanyPortalService },
      {
        provide: COMPANY_ORDERS_SOURCE,
        useFactory: (repository: CompanyPortalRepository) => createCompanyOrdersSource(repository),
        deps: [COMPANY_PORTAL_REPOSITORY],
      },
      { provide: CATALOG_PRODUCT_REPOSITORY, useClass: CatalogProductService },
    ],
    data: { tab },
    loadComponent: () => import('./pages/finance/finance.component'),
  };
}

/** Rutas del módulo de finanzas; cada workspace link conserva su URL. */
export const PURCHASES_ROUTES: Routes = [financeRoute('purchases')];
export const EXPENSES_ROUTES: Routes = [financeRoute('expenses')];
export const CASH_ROUTES: Routes = [financeRoute('cash')];
