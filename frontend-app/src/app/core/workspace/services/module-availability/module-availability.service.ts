import { inject, Injectable } from '@angular/core';
import { RuntimeConfigService } from '../../../config/runtime-config.service';
import { workspaceModuleGroups } from '../../constants/workspace-modules.constants';
import {
  resolveModuleAvailability,
  type ModuleAvailability,
  type ModuleAvailabilityDescriptor,
} from '../../models/module-availability.model';
import type {
  WorkspaceModule,
  WorkspaceModuleGroup,
  WorkspaceScope,
} from '../../models/workspace-module.model';

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

  /**
   * Grupos ya filtrados por disponibilidad. Menú y guard comparten `resolve`,
   * de modo que un enlace nunca prometa una ruta que el acceso directo bloquea.
   */
  groupsFor(
    workspace: WorkspaceScope,
    canView: (module: WorkspaceModule) => boolean,
  ): WorkspaceModuleGroup[] {
    return workspaceModuleGroups(
      workspace,
      (module) => canView(module) && this.resolve(module).available,
    );
  }
}
