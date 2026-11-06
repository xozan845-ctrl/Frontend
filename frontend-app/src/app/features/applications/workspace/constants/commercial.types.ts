import type { Provider } from '@angular/core';
import type { Routes } from '@angular/router';

/** Contexto comercial que comparte el árbol de rutas. */
export type CommercialScope = 'company' | 'store';

/** Módulo compartido entre empresa y tienda con providers por contexto. */
export interface CommercialModuleRoute {
  path: string;
  companyModuleId: string;
  storeModuleId: string;
  loadChildren: (scope: CommercialScope) => Promise<Routes>;
  providers: Readonly<Record<CommercialScope, Provider[]>>;
}
