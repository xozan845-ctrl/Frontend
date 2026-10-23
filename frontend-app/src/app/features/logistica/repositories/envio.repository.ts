import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { Shipment, ShipmentProvider } from '../models/envio.model';

/** Puerto de guías de despacho (`/admin/envios`, `/empresarios/me/envios`, `/envios`). */
export interface EnvioRepository {
  /** Todas las guías (admin/super_admin). */
  listAdmin(): Observable<Shipment[]>;
  /** Guías de la empresa activa (empresario). */
  listCompany(): Observable<Shipment[]>;
  /** Asigna flota a un envío híbrido (empresario). */
  assignProvider(id: string, provider: ShipmentProvider): Observable<Shipment>;
  /** Avanza el estado de un envío de la flota activa. */
  advanceStatus(id: string, status: string, reason?: string): Observable<Shipment>;
}

export const ENVIO_REPOSITORY = new InjectionToken<EnvioRepository>('EnvioRepository');
