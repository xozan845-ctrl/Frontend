import type { ModuleAvailabilityStatus } from './module-availability.model';

/** Superficies de trabajo conocidas por el registro de módulos. */
export type WorkspaceScope = 'platform' | 'company' | 'store' | 'logistics';

/** Sección visual del sidebar de un workspace. */
export type WorkspaceModuleSection =
  'operacion' | 'administracion' | 'finanzas' | 'analisis' | 'footer';

/** Entrada del registro de módulos de un workspace. */
export interface WorkspaceModule {
  id: string;
  label: string;
  icon: string;
  link: string;
  /** Ruta relativa para shells que resuelven el contexto (p. ej. logística). */
  path?: string;
  testId: string;
  workspace: WorkspaceScope;
  section: WorkspaceModuleSection;
  /** Permiso requerido; la sesión lo evalúa al construir la navegación. */
  permission?: string;
  /** Estado de disponibilidad (ADR-85); `ready`/`soon` ya no existen. */
  status: ModuleAvailabilityStatus;
  /** Capacidades del paquete que activan este módulo reutilizable. */
  requiredCapabilities?: readonly string[];
  /** Marca el enlace activo solo en coincidencia exacta (p. ej. dashboard). */
  exact?: boolean;
}

/** Grupo de módulos listo para pintar en un sidebar. */
export interface WorkspaceModuleGroup {
  section: WorkspaceModuleSection;
  label: string;
  items: readonly WorkspaceModule[];
}
