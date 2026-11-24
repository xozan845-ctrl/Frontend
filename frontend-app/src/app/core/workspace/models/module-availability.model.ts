import type { RuntimePackageConfig } from '../../config/runtime-config.model';
import { MODULE_AVAILABILITY_LABELS } from '../constants/module-availability.constants';

export { MODULE_AVAILABILITY_LABELS };

/**
 * Estado de disponibilidad de un módulo reutilizable (ADR-85).
 * `demo` se muestra pero no opera; `en desarrollo` no se habilita;
 * `integrado` y `validado` operan con datos reales.
 */
export type ModuleAvailabilityStatus = keyof typeof MODULE_AVAILABILITY_LABELS;

/** Motivo por el que un módulo no queda operativo. */
export type ModuleAvailabilityReason = 'capability-missing' | 'in-development' | 'demo' | null;

/** Datos del descriptor que intervienen en la resolución. */
export interface ModuleAvailabilityDescriptor {
  status: ModuleAvailabilityStatus;
  requiredCapabilities?: readonly string[];
}

/** Resultado compartido por menú, rutas y paneles del módulo. */
export interface ModuleAvailability {
  status: ModuleAvailabilityStatus;
  label: string;
  /** El módulo puede mostrarse y abrirse desde el menú. */
  available: boolean;
  /** Sus acciones hacen operaciones de negocio reales. */
  operational: boolean;
  reason: ModuleAvailabilityReason;
  missingCapabilities: readonly string[];
}

const CAPABILITY_WILDCARD = '*';

/** Capacidad derivada del id; evita duplicar el identificador en cada descriptor. */
export function moduleCapability(moduleId: string): string {
  return `module:${moduleId}`;
}

/**
 * Resuelve disponibilidad desde el paquete, sin consultar sesión ni features.
 * La visibilidad resultante es UX: no concede permisos (`R-SE-1`, ADR-85).
 */
export function resolveModuleAvailability(
  module: ModuleAvailabilityDescriptor,
  packageConfig: RuntimePackageConfig | null | undefined,
): ModuleAvailability {
  const capabilities = packageConfig?.capabilities ?? [];
  const missingCapabilities = (module.requiredCapabilities ?? []).filter(
    (capability) =>
      !capabilities.includes(CAPABILITY_WILDCARD) && !capabilities.includes(capability),
  );
  const hasCapabilities = missingCapabilities.length === 0;
  const isDemo = module.status === 'demo';
  const isInDevelopment = module.status === 'en desarrollo';
  const isOperational =
    hasCapabilities && (module.status === 'integrado' || module.status === 'validado');

  let reason: ModuleAvailabilityReason = null;
  if (!hasCapabilities) {
    reason = 'capability-missing';
  } else if (isInDevelopment) {
    reason = 'in-development';
  } else if (isDemo) {
    reason = 'demo';
  }

  return {
    status: module.status,
    label: MODULE_AVAILABILITY_LABELS[module.status],
    available: hasCapabilities && !isInDevelopment,
    operational: isOperational,
    reason,
    missingCapabilities,
  };
}
