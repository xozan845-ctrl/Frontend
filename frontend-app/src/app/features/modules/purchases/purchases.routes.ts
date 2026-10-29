import { Routes } from '@angular/router';
import {
  CATALOG_PRODUCT_REPOSITORY,
  CatalogProductService,
} from '../../applications/products/public-api';
import { CompanyProductsStore } from '../../applications/empresas/public-api';
import { PurchasesStore } from '../../domains/purchases/public-api';

/**
 * Ruta del módulo de compras. El catálogo se reutiliza para elegir productos y
 * dar de alta el producto nuevo comprado; el estado de compras vive en su
 * propio store de feature (`R-ST-6`).
 */
export const PURCHASES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/company-purchases/company-purchases.component'),
    providers: [
      PurchasesStore,
      CompanyProductsStore,
      { provide: CATALOG_PRODUCT_REPOSITORY, useClass: CatalogProductService },
    ],
  },
];
