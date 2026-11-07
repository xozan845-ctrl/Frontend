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
        type: 'comercial',
        status: 'activa',
      });
    });

    it('debe mapear los metadatos de empresa del contrato público', () => {
      expect(
        adaptCompanyFromBackend({
          id: 'c-2',
          nombre: 'Mi Empresa',
          slug: 'mi-empresa',
          tipo_empresa: 'logistica',
          ruc: 'J0310000000000',
          razon_social: 'Mi Empresa S.A.',
          nombre_comercial: 'Mi Store',
          descripcion: 'Descripción',
          telefono: '+505 8888 0000',
          correo_contacto: 'hola@empresa.test',
          sitio_web: 'https://empresa.test',
          direccion: 'Calle 1',
          ciudad: 'Managua',
          departamento: 'Managua',
          pais: 'Nicaragua',
          moneda: 'NIO',
          zona_horaria: 'America/Managua',
          sector: 'Comercio',
          representante_legal: 'Ana Pérez',
          horario_atencion: 'Lun–Vie',
          logo_objeto_id: '3f1c0a8e-7d2b-4c6a-9f10-2b8d5e4a7c01',
          logo_url: 'https://cdn.empresa.test/logo.png',
          actualizado_en: '2026-10-22T00:00:00.000Z',
        }),
      ).toEqual({
        id: 'c-2',
        name: 'Mi Empresa',
        slug: 'mi-empresa',
        logisticsMode: 'plataforma',
        type: 'logistica',
        status: 'activa',
        createdBy: '',
        createdAt: '',
        taxId: 'J0310000000000',
        legalName: 'Mi Empresa S.A.',
        commercialName: 'Mi Store',
        description: 'Descripción',
        phone: '+505 8888 0000',
        contactEmail: 'hola@empresa.test',
        website: 'https://empresa.test',
        address: 'Calle 1',
        city: 'Managua',
        department: 'Managua',
        country: 'Nicaragua',
        currency: 'NIO',
        timezone: 'America/Managua',
        sector: 'Comercio',
        legalRepresentative: 'Ana Pérez',
        businessHours: 'Lun–Vie',
        logoObjectId: '3f1c0a8e-7d2b-4c6a-9f10-2b8d5e4a7c01',
        logoUrl: 'https://cdn.empresa.test/logo.png',
        updatedAt: '2026-10-22T00:00:00.000Z',
      });
    });

    it('debe conservar un logo nulo y degradar un tipo desconocido a comercial', () => {
      expect(
        adaptCompanyFromBackend({
          id: 'c-3',
          tipo_empresa: 'desconocido',
          logo_objeto_id: null,
          logo_url: null,
        }),
      ).toMatchObject({
        id: 'c-3',
        type: 'comercial',
        logoObjectId: null,
        logoUrl: null,
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
        type: 'comercial',
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
