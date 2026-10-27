import { Routes } from '@angular/router';
import { CATALOG_PRODUCT_REPOSITORY, CatalogProductService } from '../../products/public-api';
import { CompanyProductsStore, CompanyServicesStore } from '../../empresas/public-api';

/**
 * Rutas del módulo compartido de catálogo. La composición vive aquí; el
 * dominio, los stores y los adaptadores siguen en `features/empresas`
 * (ADR-65).
 */
export const CATALOG_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/company-products/company-products.component'),
    providers: [
      CompanyProductsStore,
      CompanyServicesStore,
      { provide: CATALOG_PRODUCT_REPOSITORY, useClass: CatalogProductService },
    ],
  },
];
