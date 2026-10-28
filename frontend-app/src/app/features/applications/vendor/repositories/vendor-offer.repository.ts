import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { VendorOffer, VendorOfferPage } from '../models/vendor-offer.model';

/** Puerto de ofertas del vendedor (Core Engine, `/vendedores`). */
export interface VendorOfferRepository {
  /** Ofertas del vendedor autenticado (`GET /vendedores/me/ofertas`). */
  listOffers(page: number, limit: number): Observable<VendorOfferPage>;
  /** Cambia el margen de una oferta (`PATCH /vendedores/productos/:id`). */
  updateMargin(offerId: string, margin: number): Observable<VendorOffer>;
}

export const VENDOR_OFFER_REPOSITORY = new InjectionToken<VendorOfferRepository>(
  'VendorOfferRepository',
);
