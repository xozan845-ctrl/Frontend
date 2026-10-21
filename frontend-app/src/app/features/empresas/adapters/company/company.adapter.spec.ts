import { adaptCompanyFromBackend, adaptCompanySellerFromBackend } from './company.adapter';

describe('company.adapter', () => {
  describe('adaptCompanyFromBackend', () => {
    it('debe devolver null cuando la respuesta no es un objeto', () => {
      expect(adaptCompanyFromBackend(null)).toBeNull();
      expect(adaptCompanyFromBackend('texto')).toBeNull();
    });

    it('debe devolver null cuando falta el id', () => {
      expect(adaptCompanyFromBackend({ nombre: 'Sin id' })).toBeNull();
    });

    it('debe mapear snake_case y aplicar valores por defecto', () => {
      expect(
        adaptCompanyFromBackend({
          id: 'c-1',
          nombre: 'Mi Empresa',
          modalidad_logistica: 'propia',
          estado: 'activa',
        }),
      ).toMatchObject({
        id: 'c-1',
        name: 'Mi Empresa',
        logisticsMode: 'propia',
        status: 'activa',
      });
    });

    it('debe mapear camelCase y degradar una modalidad desconocida a plataforma', () => {
      expect(
        adaptCompanyFromBackend({
          id: 'c-2',
          name: 'Otra',
          logisticsMode: 'otra',
          createdAt: '2026-10-21T00:00:00.000Z',
        }),
      ).toMatchObject({
        id: 'c-2',
        name: 'Otra',
        logisticsMode: 'plataforma',
        createdAt: '2026-10-21T00:00:00.000Z',
      });
    });

    it('debe usar valores por defecto cuando faltan campos opcionales', () => {
      expect(adaptCompanyFromBackend({ id: 'c-3' })).toEqual({
        id: 'c-3',
        name: 'Empresa',
        logisticsMode: 'plataforma',
        status: 'activa',
        createdBy: '',
        createdAt: '',
      });
    });
  });

  describe('adaptCompanySellerFromBackend', () => {
    it('debe devolver null cuando la respuesta no es válida', () => {
      expect(adaptCompanySellerFromBackend(undefined)).toBeNull();
      expect(adaptCompanySellerFromBackend({ nombre: 'Sin id' })).toBeNull();
    });

    it('debe mapear la participación numérica y en texto', () => {
      expect(
        adaptCompanySellerFromBackend({
          id: 's-1',
          nombre: 'Vera',
          correo: 'vera@tienda.test',
          participacion_porcentaje: '30',
        }),
      ).toMatchObject({
        id: 's-1',
        name: 'Vera',
        email: 'vera@tienda.test',
        role: 'vendedor',
        participationPercentage: 30,
      });
    });

    it('debe mapear camelCase y aplicar valores por defecto', () => {
      expect(
        adaptCompanySellerFromBackend({
          id: 's-2',
          name: 'Cami',
          email: 'cami@tienda.test',
          role: 'vendedor',
        }),
      ).toEqual({
        id: 's-2',
        name: 'Cami',
        email: 'cami@tienda.test',
        role: 'vendedor',
        participationPercentage: 0,
      });
    });
  });
});
