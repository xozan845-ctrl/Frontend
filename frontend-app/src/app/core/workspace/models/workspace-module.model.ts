/** Superficies de trabajo conocidas por el registro de módulos. */
export type WorkspaceScope = 'platform' | 'company' | 'store' | 'logistics';

/** Sección visual del sidebar de un workspace. */
export type WorkspaceModuleSection =
  'operacion' | 'administracion' | 'finanzas' | 'analisis' | 'footer';

/** Estado de implementación del módulo. */
export type WorkspaceModuleStatus = 'ready' | 'soon';

/** Entrada del registro de módulos de un workspace. */
export interface WorkspaceModule {
  id: string;
  label: string;
  icon: string;
  link: string;
  testId: string;
  workspace: WorkspaceScope;
  section: WorkspaceModuleSection;
  /** Permiso requerido; la sesión lo evalúa al construir la navegación. */
  permission?: string;
  status: WorkspaceModuleStatus;
}

/** Grupo de módulos listo para pintar en un sidebar. */
export interface WorkspaceModuleGroup {
  section: WorkspaceModuleSection;
  label: string;
  items: readonly WorkspaceModule[];
}
