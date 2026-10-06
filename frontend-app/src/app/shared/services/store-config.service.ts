import { Injectable, signal } from '@angular/core';
import { COMPANY_INFO, CompanyInfo } from '../constants/company.constants';

@Injectable({
  providedIn: 'root',
})
export class StoreConfigService {
  private readonly _companyInfo = signal<CompanyInfo>({ ...COMPANY_INFO });

  readonly companyInfo = this._companyInfo.asReadonly();

  /**
   * Permite al backend actualizar dinámicamente la información de la tienda
   * (nombre, contacto, redes, etc.) manteniendo los valores por defecto si alguno falta.
   */
  updateConfig(config: Partial<CompanyInfo>): void {
    this._companyInfo.update((current) => ({
      ...current,
      ...config,
      socials: {
        ...current.socials,
        ...(config.socials || {}),
      },
    }));
  }
}
