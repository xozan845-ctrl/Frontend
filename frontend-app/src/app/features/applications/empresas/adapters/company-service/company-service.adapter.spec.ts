import {
  adaptCompanyServiceFromBackend,
  adaptCompanyServicesFromBackend,
  filterCompanyServices,
  findCompanyServiceByCode,
  normalizeCompanyServiceCode,
  parseCompanyServiceDuration,
  parseCompanyServicePrice,
} from './company-service.adapter';
import type { CompanyService } from '../../models/company-service.model';

const service: CompanyService = {
  id: 'srv-1',
  companyId: 'e-1',
  code: 'SRV-001',
  name: 'Mantenimiento preventivo',
  description: 'Revisión completa de equipos',
  category: 'Soporte técnico',
  brand: 'Marca Demo',
  barcode: '7501234567890',
  price: 1500,
  cost: 500,
  unit: 'Hora (h)',
  durationMinutes: 90,
  status: 'activo',
  createdAt: '2026-10-27T00:00:00.000Z',
  updatedAt: '2026-10-27T00:00:00.000Z',
};

describe('company-service adapter', () => {
  it('normaliza el código a mayúsculas y sin espacios', () => {
    expect(normalizeCompanyServiceCode('  srv-01  ')).toBe('SRV-01');
  });

  it('acepta precios con punto o coma y rechaza formatos inválidos', () => {
    expect(parseCompanyServicePrice('1500')).toBe(1500);
    expect(parseCompanyServicePrice('1500,50')).toBe(1500.5);
    expect(parseCompanyServicePrice('1500.555')).toBeNull();
    expect(parseCompanyServicePrice('-1')).toBeNull();
    expect(parseCompanyServicePrice('abc')).toBeNull();
  });

  it('valida la duración como entero entre 1 y 1440 minutos', () => {
    expect(parseCompanyServiceDuration(60)).toBe(60);
    expect(parseCompanyServiceDuration('90')).toBe(90);
    expect(parseCompanyServiceDuration(0)).toBeNull();
    expect(parseCompanyServiceDuration(1_441)).toBeNull();
    expect(parseCompanyServiceDuration(10_081)).toBeNull();
    expect(parseCompanyServiceDuration('abc')).toBeNull();
  });

  it('normaliza un servicio del backend en snake_case', () => {
    expect(
      adaptCompanyServiceFromBackend({
        id: 'srv-1',
        empresa_id: 'e-1',
        codigo: ' srv-001 ',
        nombre: 'Mantenimiento preventivo',
        descripcion: 'Revisión completa de equipos',
        categoria: 'Soporte técnico',
        marca: 'Marca Demo',
        codigo_barras: '7501234567890',
        precio: '1500.00',
        costo: '500.00',
        unidad: 'Hora (h)',
        duracion_minutos: 90,
        estado: 'activo',
        creado_en: '2026-10-27T00:00:00.000Z',
        actualizado_en: '2026-10-28T00:00:00.000Z',
      }),
    ).toEqual({
      ...service,
      updatedAt: '2026-10-28T00:00:00.000Z',
    });
  });

  it('tolera aliases camelCase y respuestas envueltas', () => {
    expect(
      adaptCompanyServiceFromBackend({
        data: {
          id: 2,
          empresaId: 'e-1',
          code: 'srv-2',
          name: 'Instalación',
          price: 250,
          durationMinutes: '120',
        },
      }),
    ).toMatchObject({
      id: '2',
      code: 'SRV-2',
      price: 250,
      cost: 0,
      durationMinutes: 120,
      status: 'activo',
    });
  });

  it('descarta registros inválidos y duplicados del listado', () => {
    const result = adaptCompanyServicesFromBackend({
      servicios: [
        {
          id: 'srv-1',
          empresa_id: 'e-1',
          codigo: 'SRV-001',
          nombre: 'Uno',
          precio: '100.00',
          duracion_minutos: 30,
        },
        {
          id: 'srv-2',
          empresa_id: 'e-1',
          codigo: 'SRV-001',
          nombre: 'Duplicado por código',
          precio: '100.00',
          duracion_minutos: 30,
        },
        {
          id: 'srv-3',
          empresa_id: 'e-1',
          codigo: 'SRV-003',
          nombre: 'Tres',
          precio: '100.00',
          duracion_minutos: 30,
        },
        { id: 'sin-precio', codigo: 'SRV-004', nombre: 'Inválido' },
        null,
      ],
    });

    expect(result.map((item) => item.id)).toEqual(['srv-1', 'srv-3']);
  });

  it('descarta servicios con campos obligatorios inválidos', () => {
    const base = {
      id: 'srv-1',
      codigo: 'SRV-1',
      nombre: 'Uno',
      precio: '100.00',
      duracion_minutos: 30,
    };

    expect(adaptCompanyServiceFromBackend({ ...base, codigo: 'X' })).toBeNull();
    expect(adaptCompanyServiceFromBackend({ ...base, nombre: ' ' })).toBeNull();
    expect(adaptCompanyServiceFromBackend({ ...base, precio: 'gratis' })).toBeNull();
    expect(adaptCompanyServiceFromBackend({ ...base, duracion_minutos: 0 })).toBeNull();
    expect(adaptCompanyServiceFromBackend({ ...base, id: null })).toBeNull();
  });

  it('usa defaults de unidad, estado, costo y fechas no válidas', () => {
    const adapted = adaptCompanyServiceFromBackend({
      id: 'srv-1',
      codigo: 'SRV-1',
      nombre: 'Uno',
      precio: '100.00',
      duracion_minutos: 30,
      costo: 'gratis',
      creado_en: 'no-es-fecha',
    });

    expect(adapted).toMatchObject({
      cost: 0,
      unit: 'Hora (h)',
      status: 'activo',
      createdAt: '1970-01-01T00:00:00.000Z',
      updatedAt: '1970-01-01T00:00:00.000Z',
    });
  });

  it('tolera envelopes data y respuestas no reconocidas', () => {
    expect(adaptCompanyServicesFromBackend({ data: [{ ...service }] })).toHaveLength(1);
    expect(adaptCompanyServicesFromBackend({})).toEqual([]);
    expect(adaptCompanyServicesFromBackend(null)).toEqual([]);
    expect(adaptCompanyServicesFromBackend({ items: 'no-es-lista' })).toEqual([]);
  });

  it('detecta códigos duplicados ignorando el servicio editado', () => {
    expect(findCompanyServiceByCode([service], ' srv-001 ')?.id).toBe('srv-1');
    expect(findCompanyServiceByCode([service], 'SRV-001', 'srv-1')).toBeNull();
    expect(findCompanyServiceByCode([service], 'SRV-002')).toBeNull();
  });

  it('filtra por texto, categoría, marca y estado', () => {
    const services: CompanyService[] = [
      { ...service, id: 'srv-1', name: 'Instalación de red', brand: 'Marca Demo' },
      {
        ...service,
        id: 'srv-2',
        name: 'Soporte remoto',
        category: 'Soporte',
        status: 'inactivo',
      },
    ];

    expect(filterCompanyServices(services, { search: 'instalacion' })).toHaveLength(1);
    expect(filterCompanyServices(services, { category: 'Soporte' })[0].id).toBe('srv-2');
    expect(filterCompanyServices(services, { brand: 'Marca Demo' })).toHaveLength(2);
    expect(filterCompanyServices(services, { status: 'inactivo' })[0].id).toBe('srv-2');
    expect(filterCompanyServices(services, { sort: 'nombre-za' })[0].id).toBe('srv-2');
  });
});
