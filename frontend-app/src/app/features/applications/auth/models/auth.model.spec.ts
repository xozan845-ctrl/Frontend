import { isCompanyOwnerRole, isSellerRole, isStoreSellerRole } from './auth.model';

describe('auth role helpers', () => {
  it('separa propietario, vendedor y roles que pueden operar un negocio', () => {
    expect(isCompanyOwnerRole('empresario')).toBe(true);
    expect(isCompanyOwnerRole('vendedor')).toBe(false);
    expect(isStoreSellerRole('vendedor')).toBe(true);
    expect(isStoreSellerRole('empresario')).toBe(false);
    expect(isSellerRole('empresario')).toBe(true);
    expect(isSellerRole('vendedor')).toBe(true);
    expect(isSellerRole('comprador')).toBe(false);
  });
});
