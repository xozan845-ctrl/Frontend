import {
  canEnterWorkspace,
  canManageLogistics,
  canManageStoreRoles,
  hasPermission,
  isPlatformRole,
  isSuperAdminRole,
} from './authorization.model';
import type { User } from './auth.model';

const user = (overrides: Partial<User>): User => ({
  id: 'u-1',
  email: 'user@test.local',
  name: 'User',
  ...overrides,
});

describe('authorization policy', () => {
  it('separa plataforma de operación comercial', () => {
    const root = user({ role: 'super_admin' });
    const owner = user({ role: 'empresario', tenantId: 'company-1' });
    const seller = user({ role: 'vendedor', tenantId: 'company-1', storeId: 'store-1' });

    expect(isPlatformRole(root.role)).toBe(true);
    expect(isSuperAdminRole(root.role)).toBe(true);
    expect(canEnterWorkspace(root, 'platform')).toBe(true);
    expect(canEnterWorkspace(root, 'logistics')).toBe(false);
    expect(canEnterWorkspace(owner, 'company')).toBe(true);
    expect(canEnterWorkspace(owner, 'store')).toBe(false);
    expect(canEnterWorkspace(seller, 'store')).toBe(true);
  });

  it('mantiene la logística dentro de empresa o tienda, nunca de plataforma', () => {
    const root = user({ role: 'super_admin' });
    const owner = user({ role: 'empresario', tenantId: 'company-1' });
    const seller = user({ role: 'vendedor', tenantId: 'company-1', storeId: 'store-1' });

    expect(hasPermission(root, 'platform:manage-infrastructure')).toBe(true);
    expect(hasPermission(root, 'logistics:manage-fleet')).toBe(false);
    expect(canManageLogistics(owner, 'company')).toBe(true);
    expect(canManageLogistics(owner, 'store')).toBe(false);
    expect(canManageLogistics(seller, 'store')).toBe(true);
    expect(canManageLogistics(seller, 'company')).toBe(false);
  });

  it('separa una empresa logística independiente del tenant comercial', () => {
    const owner = user({
      role: 'vendedor',
      tenantId: 'company-1',
      storeId: 'store-1',
      logisticsCompanyId: 'logistics-1',
      logisticsCompanyRole: 'owner',
    });

    expect(canEnterWorkspace(owner, 'logistics')).toBe(true);
    expect(hasPermission(owner, 'logistics:manage-team')).toBe(true);
    expect(canManageLogistics(owner, 'logistics_company')).toBe(true);
  });

  it('permite entrar a un miembro con rol de empresa logística', () => {
    const member = user({
      role: 'empresa_logistica',
      logisticsCompanyId: 'logistics-1',
      logisticsCompanyRole: 'member',
    });

    expect(canEnterWorkspace(member, 'logistics')).toBe(true);
    expect(hasPermission(member, 'logistics:read')).toBe(true);
    expect(canManageLogistics(member, 'logistics_company')).toBe(false);
  });

  it('permite delegar solo los permisos explícitos de una tienda', () => {
    const seller = user({
      role: 'vendedor',
      tenantId: 'company-1',
      storeId: 'store-1',
      permissions: ['store:read', 'store:manage-roles'],
    });

    expect(canManageStoreRoles(seller)).toBe(true);
    expect(hasPermission(seller, 'store:manage-orders')).toBe(false);
    expect(hasPermission(seller, 'company:manage-sellers')).toBe(false);
  });
});
