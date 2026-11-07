import type { Route } from '@angular/router';
import type { CommercialModuleRoute, CommercialScope } from './commercial.types';
import {
  CLIENTS_PAGE_CONFIG,
  CLIENTS_SCOPE_CONFIG,
} from '../../../../shared/clients/constants/clients-config.tokens';
import { BANKS_SCOPE_CONFIG } from '../../../../shared/banks/constants/banks-config.tokens';
import { PAYABLES_SCOPE_CONFIG } from '../../../../shared/payables/constants/payables-config.tokens';
import { BARCODES_SCOPE_CONFIG } from '../../../../shared/barcodes/constants/barcodes-config.tokens';
import { CREDITS_SCOPE_CONFIG } from '../../../../shared/credits/constants/credits-config.tokens';
import { moduleGuard } from '../../auth/public-api';
import {
  COMPANY_CLIENTS_PAGE_CONFIG,
  COMPANY_CLIENTS_SCOPE_CONFIG,
} from '../../company/constants/company-clients-page.config';
import {
  VENDOR_CLIENTS_PAGE_CONFIG,
  VENDOR_CLIENTS_SCOPE_CONFIG,
} from '../../store/constants/vendor-clients-page.config';
import { COMPANY_BANKS_SCOPE_CONFIG } from '../../company/constants/company-banks.config';
import { VENDOR_BANKS_SCOPE_CONFIG } from '../../store/constants/vendor-banks.config';
import { COMPANY_PAYABLES_SCOPE_CONFIG } from '../../company/constants/company-payables.config';
import { VENDOR_PAYABLES_SCOPE_CONFIG } from '../../store/constants/vendor-payables.config';
import { COMPANY_BARCODES_SCOPE_CONFIG } from '../../company/constants/company-barcodes.config';
import { VENDOR_BARCODES_SCOPE_CONFIG } from '../../store/constants/vendor-barcodes.config';
import { COMPANY_CREDITS_SCOPE_CONFIG } from '../../company/constants/company-credits.config';
import { VENDOR_CREDITS_SCOPE_CONFIG } from '../../store/constants/vendor-credits.config';

const commercialModules: readonly CommercialModuleRoute[] = [
  {
    path: 'clientes',
    companyModuleId: 'company.clients',
    storeModuleId: 'store.clients',
    loadChildren: () =>
      import('../../../modules/clients/clients.routes').then((module) => module.CLIENTS_ROUTES),
    providers: {
      company: [
        { provide: CLIENTS_PAGE_CONFIG, useValue: COMPANY_CLIENTS_PAGE_CONFIG },
        { provide: CLIENTS_SCOPE_CONFIG, useValue: COMPANY_CLIENTS_SCOPE_CONFIG },
      ],
      store: [
        { provide: CLIENTS_PAGE_CONFIG, useValue: VENDOR_CLIENTS_PAGE_CONFIG },
        { provide: CLIENTS_SCOPE_CONFIG, useValue: VENDOR_CLIENTS_SCOPE_CONFIG },
      ],
    },
  },
  {
    path: 'bancos',
    companyModuleId: 'company.banks',
    storeModuleId: 'store.banks',
    loadChildren: () =>
      import('../../../modules/banks/banks.routes').then((module) => module.BANKS_ROUTES),
    providers: {
      company: [{ provide: BANKS_SCOPE_CONFIG, useValue: COMPANY_BANKS_SCOPE_CONFIG }],
      store: [{ provide: BANKS_SCOPE_CONFIG, useValue: VENDOR_BANKS_SCOPE_CONFIG }],
    },
  },
  {
    path: 'cuentas-por-pagar',
    companyModuleId: 'company.payables',
    storeModuleId: 'store.payables',
    loadChildren: () =>
      import('../../../modules/payables/payables.routes').then((module) => module.PAYABLES_ROUTES),
    providers: {
      company: [{ provide: PAYABLES_SCOPE_CONFIG, useValue: COMPANY_PAYABLES_SCOPE_CONFIG }],
      store: [{ provide: PAYABLES_SCOPE_CONFIG, useValue: VENDOR_PAYABLES_SCOPE_CONFIG }],
    },
  },
  {
    path: 'codigos-de-barras',
    companyModuleId: 'company.barcodes',
    storeModuleId: 'store.barcodes',
    loadChildren: () =>
      import('../../../modules/barcodes/barcodes.routes').then((module) => module.BARCODES_ROUTES),
    providers: {
      company: [{ provide: BARCODES_SCOPE_CONFIG, useValue: COMPANY_BARCODES_SCOPE_CONFIG }],
      store: [{ provide: BARCODES_SCOPE_CONFIG, useValue: VENDOR_BARCODES_SCOPE_CONFIG }],
    },
  },
  {
    path: 'creditos',
    companyModuleId: 'company.credit',
    storeModuleId: 'store.credit',
    loadChildren: () =>
      import('../../../modules/credits/credits.routes').then((module) => module.CREDITS_ROUTES),
    providers: {
      company: [{ provide: CREDITS_SCOPE_CONFIG, useValue: COMPANY_CREDITS_SCOPE_CONFIG }],
      store: [{ provide: CREDITS_SCOPE_CONFIG, useValue: VENDOR_CREDITS_SCOPE_CONFIG }],
    },
  },
  {
    path: 'reportes',
    companyModuleId: 'company.reports',
    storeModuleId: 'store.reports',
    loadChildren: (scope) =>
      scope === 'company'
        ? import('../../../modules/reports/reports.routes').then(
            (module) => module.COMPANY_REPORTS_ROUTES,
          )
        : import('../../../modules/reports/reports.routes').then(
            (module) => module.VENDOR_REPORTS_ROUTES,
          ),
    providers: { company: [], store: [] },
  },
];

/**
 * Rutas compartidas entre la empresa y la tienda. La diferencia de scope se
 * resuelve con los providers de cada contexto, no duplicando el árbol de rutas.
 */
export function commercialScopeRoutes(scope: CommercialScope): Route[] {
  return commercialModules.map((module) => ({
    path: module.path,
    canActivate: [moduleGuard(scope === 'company' ? module.companyModuleId : module.storeModuleId)],
    loadChildren: () => module.loadChildren(scope),
    providers: module.providers[scope],
  }));
}
