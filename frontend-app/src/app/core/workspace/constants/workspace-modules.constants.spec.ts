import {
  WORKSPACE_MODULES,
  workspaceModuleById,
  workspaceModuleGroups,
} from './workspace-modules.constants';

describe('workspace-modules.constants', () => {
  it('debe agrupar operación, administración y footer de empresa', () => {
    const groups = workspaceModuleGroups('company', () => true);

    expect(groups.map((group) => group.section)).toEqual(['operacion', 'administracion', 'footer']);
    expect(groups[0].label).toBe('Operación');
    expect(groups[1].label).toBe('Administración');
    expect(groups[2].label).toBe('');
    expect(groups[0].items.map((item) => item.label)).toContain('Ventas');
    expect(groups[1].items.map((item) => item.label)).toContain('Vendedores');
  });

  it('debe separar los módulos de tienda de los de empresa', () => {
    const companyIds = workspaceModuleGroups('company', () => true).flatMap((group) =>
      group.items.map((item) => item.id),
    );
    const storeIds = workspaceModuleGroups('store', () => true).flatMap((group) =>
      group.items.map((item) => item.id),
    );

    expect(companyIds).toContain('company.sales');
    expect(companyIds).not.toContain('store.sales');
    expect(storeIds).toContain('store.sales');
    expect(storeIds).not.toContain('company.sales');
  });

  it('debe respetar el predicado de visibilidad', () => {
    const groups = workspaceModuleGroups('company', (module) => !module.permission);
    const ids = groups.flatMap((group) => group.items.map((item) => item.id));

    expect(ids).toEqual([]);
  });

  it('debe resolver un módulo por id', () => {
    expect(workspaceModuleById('company.sales')?.label).toBe('Ventas');
    expect(workspaceModuleById('no.existe')).toBeUndefined();
  });

  it('debe mantener ids y testIds únicos', () => {
    const ids = WORKSPACE_MODULES.map((module) => module.id);
    const testIds = WORKSPACE_MODULES.map((module) => module.testId);

    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(testIds).size).toBe(testIds.length);
    expect(testIds.every((testId) => testId.length > 0)).toBe(true);
  });
});
