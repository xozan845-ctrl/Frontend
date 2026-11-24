import { inject, Injectable } from '@angular/core';
import { RuntimeConfigService } from '../../../config/runtime-config.service';
import {
  resolveModuleAvailability,
  type ModuleAvailability,
  type ModuleAvailabilityDescriptor,
} from '../../models/module-availability.model';

/**
 * Resolución única de disponibilidad para menú, rutas y módulos (ADR-85).
 * Reexporta el paquete vigente para que ningún consumidor lea la configuración
 * por su cuenta; los permisos siguen evaluándose en la sesión y el backend.
 */
@Injectable({
  providedIn: 'root',
})
export class ModuleAvailabilityService {
  private readonly runtimeConfig = inject(RuntimeConfigService);

  readonly packageConfig = this.runtimeConfig.packageConfig;

  resolve(module: ModuleAvailabilityDescriptor): ModuleAvailability {
    return resolveModuleAvailability(module, this.packageConfig());
  }
}
