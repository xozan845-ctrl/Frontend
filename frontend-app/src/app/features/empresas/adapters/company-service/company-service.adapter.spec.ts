import {
  createCompanyServiceRecord,
  filterCompanyServices,
  findCompanyServiceByCode,
  normalizeCompanyServiceCode,
  parseCompanyServiceDuration,
  parseCompanyServicePrice,
  sanitizeCompanyServices,
  updateCompanyServiceRecord,
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

  it('valida la duración como entero entre 1 y 10080 minutos', () => {
    expect(parseCompanyServiceDuration(60)).toBe(60);
    expect(parseCompanyServiceDuration('90')).toBe(90);
    expect(parseCompanyServiceDuration(0)).toBeNull();
    expect(parseCompanyServiceDuration(10_081)).toBeNull();
    expect(parseCompanyServiceDuration('abc')).toBeNull();
  });

  it('sanea la lista y descarta duplicados por id o código', () => {
    const result = sanitizeCompanyServices([
      service,
      { ...service, id: 'srv-2' },
      { ...service, id: 'srv-3', code: 'SRV-003' },
      { id: 'invalido' },
      null,
    ]);

    expect(result).toHaveLength(2);
    expect(result.map((item) => item.id)).toEqual(['srv-1', 'srv-3']);
  });

  it('crea un registro normalizado desde el formulario', () => {
    const created = createCompanyServiceRecord(
      {
        code: ' srv-002 ',
        name: '  Instalación  ',
        description: '  En sitio  ',
        category: '  Campo  ',
        price: '250.50',
        durationMinutes: 120,
      },
      { id: 'srv-2', companyId: 'e-1', now: '2026-10-27T10:00:00.000Z' },
    );

    expect(created).toEqual({
      id: 'srv-2',
      companyId: 'e-1',
      code: 'SRV-002',
      name: 'Instalación',
      description: 'En sitio',
      category: 'Campo',
      brand: '',
      barcode: '',
      price: 250.5,
      cost: 0,
      unit: 'Hora (h)',
      durationMinutes: 120,
      status: 'activo',
      createdAt: '2026-10-27T10:00:00.000Z',
      updatedAt: '2026-10-27T10:00:00.000Z',
    });
  });

  it('rechaza la creación con precio o duración inválidos', () => {
    expect(
      createCompanyServiceRecord(
        { code: 'SRV-2', name: 'Demo', price: 'gratis', durationMinutes: 60 },
        { id: 'srv-2', companyId: 'e-1', now: '2026-10-27T10:00:00.000Z' },
      ),
    ).toBeNull();
  });

  it('actualiza solo los campos editables y refresca updatedAt', () => {
    const updated = updateCompanyServiceRecord(
      service,
      {
        name: 'Mantenimiento express',
        price: '2000',
        cost: '800',
        brand: 'Otra marca',
        barcode: '123',
        unit: 'Servicio',
        durationMinutes: 45,
        status: 'inactivo',
      },
      '2026-10-28T00:00:00.000Z',
    );

    expect(updated).toEqual({
      ...service,
      name: 'Mantenimiento express',
      price: 2000,
      cost: 800,
      brand: 'Otra marca',
      barcode: '123',
      unit: 'Servicio',
      durationMinutes: 45,
      status: 'inactivo',
      updatedAt: '2026-10-28T00:00:00.000Z',
    });
  });

  it('detecta códigos duplicados sin distinguir mayúsculas', () => {
    expect(findCompanyServiceByCode([service], 'srv-001')?.id).toBe('srv-1');
    expect(findCompanyServiceByCode([service], 'SRV-001', 'srv-1')).toBeNull();
  });

  it('filtra por texto sin acentos, categoría, marca y estado', () => {
    const other: CompanyService = {
      ...service,
      id: 'srv-2',
      code: 'SRV-002',
      name: 'Instalación de red',
      category: 'Campo',
      brand: 'Otra marca',
      status: 'inactivo',
    };

    expect(filterCompanyServices([service, other], { search: 'instalacion' })).toEqual([other]);
    expect(filterCompanyServices([service, other], { category: 'soporte tecnico' })).toEqual([
      service,
    ]);
    expect(filterCompanyServices([service, other], { brand: 'marca demo' })).toEqual([service]);
    expect(filterCompanyServices([service, other], { status: 'inactivo' })).toEqual([other]);
    expect(filterCompanyServices([service, other])).toHaveLength(2);
  });

  it('ordena por nombre, precio y duración', () => {
    const other: CompanyService = {
      ...service,
      id: 'srv-2',
      code: 'SRV-002',
      name: 'Instalación de red',
      price: 2000,
      durationMinutes: 60,
    };

    expect(filterCompanyServices([service, other], { sort: 'nombre-az' }).map((s) => s.id)).toEqual(
      ['srv-2', 'srv-1'],
    );
    expect(
      filterCompanyServices([service, other], { sort: 'precio-desc' }).map((s) => s.id),
    ).toEqual(['srv-2', 'srv-1']);
    expect(filterCompanyServices([service, other], { sort: 'stock-asc' }).map((s) => s.id)).toEqual(
      ['srv-2', 'srv-1'],
    );
  });

  it('descarta registros sin id, nombre, código o precio válido', () => {
    expect(
      sanitizeCompanyServices([
        { ...service, id: '' },
        { ...service, name: '  ' },
        { ...service, code: '#' },
        { ...service, price: 'gratis' },
        { ...service, durationMinutes: 0 },
        'no-es-objeto',
      ]),
    ).toEqual([]);
  });

  it('recupera un createdAt inválido con una fecha segura', () => {
    const [sanitized] = sanitizeCompanyServices([
      { ...service, createdAt: 'no-es-fecha', updatedAt: 'tampoco' },
    ]);

    expect(sanitized.createdAt).toBe(new Date(0).toISOString());
    expect(sanitized.updatedAt).toBe(new Date(0).toISOString());
  });

  it('no actualiza si el precio, el costo, la duración o el nombre son inválidos', () => {
    expect(
      updateCompanyServiceRecord(service, { price: 'gratis' }, '2026-10-28T00:00:00.000Z'),
    ).toBeNull();
    expect(
      updateCompanyServiceRecord(service, { cost: 'gratis' }, '2026-10-28T00:00:00.000Z'),
    ).toBeNull();
    expect(
      updateCompanyServiceRecord(service, { durationMinutes: 0 }, '2026-10-28T00:00:00.000Z'),
    ).toBeNull();
    expect(
      updateCompanyServiceRecord(service, { name: '  ' }, '2026-10-28T00:00:00.000Z'),
    ).toBeNull();
  });

  it('mantiene los valores actuales cuando la actualización es parcial', () => {
    const updated = updateCompanyServiceRecord(service, {}, '2026-10-28T00:00:00.000Z');

    expect(updated).toEqual({
      ...service,
      updatedAt: '2026-10-28T00:00:00.000Z',
    });
  });
});
