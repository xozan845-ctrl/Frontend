import { Component } from '@angular/core';
import {
  CATALOG_PRODUCT_REPOSITORY,
  CatalogProductService,
  CatalogProductsStore,
} from '../../../products/public-api';
import { CatalogComponent } from '../../../products/public-ui';

/** Catálogo maestro dentro del workspace del propietario de empresa. */
@Component({
  selector: 'app-company-catalog',
  standalone: true,
  imports: [CatalogComponent],
  providers: [
    CatalogProductsStore,
    { provide: CATALOG_PRODUCT_REPOSITORY, useClass: CatalogProductService },
  ],
  templateUrl: './company-catalog.component.html',
})
export default class CompanyCatalogComponent {}
