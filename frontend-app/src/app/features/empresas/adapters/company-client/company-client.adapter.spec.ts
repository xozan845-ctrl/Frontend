import {
  buildCompanyClients,
  companyClientFallbackName,
  computeCompanyClientKpis,
  createCompanyClientRecord,
  filterCompanyClientsByChip,
  filterCompanyClientsByTab,
  findDuplicateCompanyClient,
  normalizeCompanyClientSearch,
  parseCompanyClientsCsv,
  sanitizeCompanyClientRecords,
  searchCompanyClients,
} from './company-client.adapter';
import type { CompanyClientRecord } from '../../models/company-client.model';
import type { OrderResponse } from '../../../cart/public-api';

const NOW = new Date(2026, 9, 27, 12, 0, 0);

function daysAgo(days: number, hour = 12): string {
  return new Date(2026, 9, 27 - days, hour, 0, 0).toISOString();
}

function order(overrides: Partial<OrderResponse> = {}): OrderResponse {
  return {
    id: 'o-1',
    orderNumber: 'ORD-1',
    status: 'pagada',
    total: 100,
    createdAt: daysAgo(2),
    buyerId: 'buyer-1',
    ...overrides,
  };
}

function localRecord(overrides: Partial<CompanyClientRecord> = {}): CompanyClientRecord {
  return {
    id: 'local-1',
    name: 'Carla López',
    phone: '+505 8888 8888',
    email: 'carla@correo.com',
    company: 'Distribuidora Norte',
    source: 'manual',
    createdAt: daysAgo(5),
    ...overrides,
  };
}

describe('company-client.adapter', () => {
  describe('buildCompanyClients', () => {
    it('debe agrupar compras por comprador y excluir canceladas', () => {
      const clients = buildCompanyClients(
        [
          order({ id: 'o-1', total: 100, createdAt: daysAgo(10) }),
          order({ id: 'o-2', total: 250, createdAt: daysAgo(2) }),
          order({ id: 'o-3', buyerId: 'buyer-2', total: 999, status: 'cancelada' }),
          order({ id: 'o-4', buyerId: 'buyer-2', total: 50, createdAt: daysAgo(40) }),
          order({ id: 'o-5', buyerId: undefined, total: 70 }),
        ],
        [
          localRecord({ buyerId: 'buyer-1' }),
          localRecord({ id: 'local-2', name: 'Sin Compras', phone: '', email: '', company: '' }),
        ],
        NOW,
      );

      expect(clients).toHaveLength(3);
      const carla = clients.find((client) => client.buyerId === 'buyer-1');
      expect(carla).toMatchObject({
        name: 'Carla López',
        phone: '+505 8888 8888',
        email: 'carla@correo.com',
        company: 'Distribuidora Norte',
        ordersCount: 2,
        totalSpent: 350,
        averageTicket: 175,
        isActive: true,
        isInactive: false,
        isFrequent: false,
        isNew: true,
        status: 'nuevo',
      });
      expect(carla?.firstPurchaseAt).toBe(daysAgo(10));
      expect(carla?.lastPurchaseAt).toBe(daysAgo(2));

      const pedro = clients.find((client) => client.buyerId === 'buyer-2');
      expect(pedro).toMatchObject({
        name: 'Cliente BUYER-2',
        ordersCount: 1,
        totalSpent: 50,
        isActive: false,
        isInactive: true,
        status: 'inactivo',
      });

      const withoutOrders = clients.find((client) => client.id === 'local-2');
      expect(withoutOrders).toMatchObject({
        ordersCount: 0,
        totalSpent: 0,
        averageTicket: 0,
        firstPurchaseAt: null,
        lastPurchaseAt: null,
        isActive: false,
        isInactive: false,
        status: 'sin_compras',
      });
    });

    it('debe usar los datos de contacto de la orden cuando no hay registro local', () => {
      const [client] = buildCompanyClients(
        [
          order({
            buyerId: 'buyer-9',
            buyerName: '  Pedro Ruiz  ',
            buyerPhone: ' 8888 1111 ',
            buyerEmail: ' PEDRO@CORREO.COM ',
            buyerCompany: ' Pedro S.A. ',
          }),
        ],
        [],
        NOW,
      );

      expect(client).toMatchObject({
        name: 'Pedro Ruiz',
        phone: '8888 1111',
        email: 'PEDRO@CORREO.COM',
        company: 'Pedro S.A.',
      });
    });

    it('debe generar un nombre visible cuando solo existe el id del comprador', () => {
      const [client] = buildCompanyClients([order({ buyerId: 'comprador-123456789' })], [], NOW);

      expect(client.name).toBe('Cliente 23456789');
      expect(companyClientFallbackName('abc')).toBe('Cliente ABC');
    });

    it('debe ordenar la cartera por nombre y respetar el registro local más antiguo', () => {
      const clients = buildCompanyClients(
        [order({ buyerId: 'b-2' }), order({ buyerId: 'b-1' })],
        [localRecord({ id: 'local-1', buyerId: 'b-1', name: 'Zulema' })],
        NOW,
      );

      expect(clients.map((client) => client.name)).toEqual(['Cliente B-2', 'Zulema']);
    });
  });

  describe('computeCompanyClientKpis', () => {
    it('debe calcular totales, activos, nuevos, top y ticket promedio', () => {
      const clients = buildCompanyClients(
        [
          order({ id: 'o-1', total: 100, createdAt: daysAgo(10) }),
          order({ id: 'o-2', total: 250, createdAt: daysAgo(2) }),
          order({ id: 'o-3', buyerId: 'buyer-2', total: 50, createdAt: daysAgo(40) }),
        ],
        [
          localRecord({ buyerId: 'buyer-1' }),
          localRecord({ id: 'local-2', name: 'Sin Compras', phone: '', email: '', company: '' }),
        ],
        NOW,
      );

      expect(computeCompanyClientKpis(clients)).toEqual({
        totalClients: 3,
        activeClients: 1,
        newThisMonth: 2,
        topClient: expect.objectContaining({ name: 'Carla López', totalSpent: 350 }),
        totalGenerated: 400,
        averageTicket: 133.33,
        totalOrders: 3,
      });
    });

    it('debe devolver top nulo y ticket cero cuando no hay compras', () => {
      const clients = buildCompanyClients(
        [],
        [localRecord({ id: 'local-1', name: 'Sin Compras', phone: '', email: '' })],
        NOW,
      );

      expect(computeCompanyClientKpis(clients)).toMatchObject({
        totalClients: 1,
        activeClients: 0,
        newThisMonth: 1,
        topClient: null,
        totalGenerated: 0,
        averageTicket: 0,
        totalOrders: 0,
      });
    });
  });

  describe('filtros y búsqueda', () => {
    const clients = buildCompanyClients(
      [
        order({ id: 'o-1', total: 100, createdAt: daysAgo(10) }),
        order({ id: 'o-2', total: 250, createdAt: daysAgo(2) }),
        order({ id: 'o-3', buyerId: 'buyer-2', total: 50, createdAt: daysAgo(40) }),
      ],
      [
        localRecord({ buyerId: 'buyer-1' }),
        localRecord({ id: 'local-2', name: 'Sin Compras', phone: '', email: '', company: '' }),
      ],
      NOW,
    );

    it('debe ordenar la vista top por facturación', () => {
      expect(filterCompanyClientsByTab(clients, 'top').map((client) => client.name)).toEqual([
        'Carla López',
        'Cliente BUYER-2',
      ]);
    });

    it('debe filtrar frecuentes e inactivos', () => {
      const frequent = buildCompanyClients(
        [
          order({ id: 'o-1', createdAt: daysAgo(60) }),
          order({ id: 'o-2', createdAt: daysAgo(30) }),
          order({ id: 'o-3', createdAt: daysAgo(2) }),
        ],
        [localRecord()],
        NOW,
      );

      expect(filterCompanyClientsByTab(frequent, 'frequent')).toHaveLength(1);
      expect(filterCompanyClientsByTab(frequent, 'frequent')[0].status).toBe('frecuente');
      expect(filterCompanyClientsByTab(clients, 'inactive').map((client) => client.name)).toEqual([
        'Cliente BUYER-2',
      ]);
    });

    it('debe ordenar los inactivos del más antiguo al más reciente', () => {
      const inactive = buildCompanyClients(
        [
          order({ buyerId: 'buyer-reciente', total: 10, createdAt: daysAgo(40) }),
          order({ buyerId: 'buyer-antiguo', total: 20, createdAt: daysAgo(80) }),
        ],
        [],
        NOW,
      );

      expect(
        filterCompanyClientsByTab(inactive, 'inactive').map((client) => client.buyerId),
      ).toEqual(['buyer-antiguo', 'buyer-reciente']);
    });

    it('debe aplicar chips de activos, nuevos, con y sin compras', () => {
      expect(filterCompanyClientsByChip(clients, 'active')).toHaveLength(1);
      expect(filterCompanyClientsByChip(clients, 'inactive')).toHaveLength(1);
      expect(filterCompanyClientsByChip(clients, 'new')).toHaveLength(2);
      expect(filterCompanyClientsByChip(clients, 'with-orders')).toHaveLength(2);
      expect(filterCompanyClientsByChip(clients, 'without-orders')).toHaveLength(1);
      expect(filterCompanyClientsByChip(clients, 'frequent')).toHaveLength(0);
      expect(filterCompanyClientsByChip(clients, 'all')).toHaveLength(3);
    });

    it('debe buscar por nombre sin acentos, teléfono, correo, empresa e id', () => {
      expect(searchCompanyClients(clients, 'lopez').map((client) => client.name)).toEqual([
        'Carla López',
      ]);
      expect(searchCompanyClients(clients, '8888')).toHaveLength(1);
      expect(searchCompanyClients(clients, 'CARLA@CORREO')).toHaveLength(1);
      expect(searchCompanyClients(clients, 'distribuidora')).toHaveLength(1);
      expect(searchCompanyClients(clients, 'buyer-2')).toHaveLength(1);
      expect(searchCompanyClients(clients, '   ')).toHaveLength(3);
      expect(searchCompanyClients(clients, 'zzz')).toHaveLength(0);
    });

    it('debe normalizar texto para búsquedas', () => {
      expect(normalizeCompanyClientSearch('  López  ')).toBe('lopez');
    });
  });

  describe('sanitizeCompanyClientRecords', () => {
    it('debe descartar entradas inválidas y sanear los campos', () => {
      const records = sanitizeCompanyClientRecords([
        null,
        'texto',
        { id: '', name: 'Sin id' },
        {
          id: 'local-1',
          name: '  Carla  ',
          phone: ' 8888 ',
          email: ' CARLA@CORREO.COM ',
          company: ' Norte ',
          source: 'import',
          createdAt: daysAgo(1),
          buyerId: ' buyer-1 ',
        },
        { id: 'local-1', name: 'Duplicado' },
        { id: 'local-2', name: '', source: 'otro', createdAt: 'no-es-fecha' },
      ]);

      expect(records).toHaveLength(2);
      expect(records[0]).toMatchObject({
        id: 'local-1',
        name: 'Carla',
        phone: '8888',
        email: 'carla@correo.com',
        company: 'Norte',
        source: 'import',
        buyerId: 'buyer-1',
      });
      expect(records[1]).toMatchObject({
        id: 'local-2',
        name: 'Cliente',
        source: 'manual',
      });
      expect(Number.isNaN(Date.parse(records[1].createdAt))).toBe(false);
    });

    it('debe devolver una lista vacía cuando el valor no es un arreglo', () => {
      expect(sanitizeCompanyClientRecords(null)).toEqual([]);
      expect(sanitizeCompanyClientRecords({ id: 'x' })).toEqual([]);
    });
  });

  describe('createCompanyClientRecord y duplicados', () => {
    it('debe crear un registro con id único y datos normalizados', () => {
      const first = createCompanyClientRecord(
        {
          name: '  Carla López ',
          phone: ' +505 8888 8888 ',
          email: ' CARLA@CORREO.COM ',
          company: ' Norte ',
          buyerId: ' buyer-1 ',
        },
        'manual',
        NOW,
      );
      const second = createCompanyClientRecord({ name: 'Otro' }, 'import', NOW);

      expect(first).toMatchObject({
        name: 'Carla López',
        phone: '+505 8888 8888',
        email: 'carla@correo.com',
        company: 'Norte',
        buyerId: 'buyer-1',
        source: 'manual',
        createdAt: NOW.toISOString(),
      });
      expect(first.id).not.toBe(second.id);
      expect(second.name).toBe('Otro');
      expect(second.source).toBe('import');
    });

    it('debe detectar duplicados por comprador, correo, teléfono o nombre sin contacto', () => {
      const records: CompanyClientRecord[] = [
        localRecord({ id: 'local-1', buyerId: 'buyer-1' }),
        localRecord({
          id: 'local-2',
          name: 'Sin Contacto',
          phone: '',
          email: '',
          buyerId: undefined,
        }),
      ];

      expect(
        findDuplicateCompanyClient(
          records,
          localRecord({ id: 'new-1', buyerId: 'buyer-1', email: '', phone: '' }),
        ),
      ).toBe(true);
      expect(
        findDuplicateCompanyClient(
          records,
          localRecord({ id: 'new-2', buyerId: undefined, email: 'CARLA@CORREO.COM', phone: '' }),
        ),
      ).toBe(true);
      expect(
        findDuplicateCompanyClient(
          records,
          localRecord({ id: 'new-3', buyerId: undefined, email: '', phone: '50588888888' }),
        ),
      ).toBe(true);
      expect(
        findDuplicateCompanyClient(
          records,
          localRecord({
            id: 'new-4',
            buyerId: undefined,
            email: '',
            phone: '',
            name: 'sin contacto',
          }),
        ),
      ).toBe(true);
      expect(
        findDuplicateCompanyClient(
          records,
          localRecord({ id: 'new-5', buyerId: undefined, email: '', phone: '', name: 'Otro' }),
        ),
      ).toBe(false);
    });
  });

  describe('parseCompanyClientsCsv', () => {
    it('debe leer un CSV con punto y coma, BOM y comillas', () => {
      const result = parseCompanyClientsCsv(
        '\uFEFFNombre;Teléfono;Email;Empresa;Comprador ID\n' +
          '"López; Carla";\'+505 8888 8888;CARLA@CORREO.COM;"Distribuidora; Norte";buyer-1\n',
      );

      expect(result.errors).toEqual([]);
      expect(result.rows).toEqual([
        {
          name: 'López; Carla',
          phone: '+505 8888 8888',
          email: 'carla@correo.com',
          company: 'Distribuidora; Norte',
          buyerId: 'buyer-1',
        },
      ]);
    });

    it('debe leer un CSV con comas, comillas escapadas y saltos de línea', () => {
      const result = parseCompanyClientsCsv(
        'name,phone,email,company\n' +
          '"Carla ""La Jefa""",8888,carla@correo.com,"Norte\nCentral"\n',
      );

      expect(result.errors).toEqual([]);
      expect(result.rows[0]).toMatchObject({
        name: 'Carla "La Jefa"',
        phone: '8888',
        email: 'carla@correo.com',
        company: 'Norte\nCentral',
      });
    });

    it('debe detectar el delimitador cuando el encabezado tiene comillas escapadas', () => {
      const result = parseCompanyClientsCsv(
        '"Nombre ""Completo""",email\nCarla,carla@correo.com\n',
      );

      expect(result.errors).toEqual([]);
      expect(result.rows[0]).toMatchObject({ name: 'Carla', email: 'carla@correo.com' });
    });

    it('debe leer un CSV separado por tabulador y derivar el nombre del correo', () => {
      const result = parseCompanyClientsCsv(
        'email\ttelefono\tempresa\ncarla@correo.com\t8888\tNorte\n',
      );

      expect(result.errors).toEqual([]);
      expect(result.rows[0]).toMatchObject({
        name: 'carla',
        phone: '8888',
        email: 'carla@correo.com',
        company: 'Norte',
      });
    });

    it('debe reportar filas sin nombre y correos inválidos', () => {
      const result = parseCompanyClientsCsv(
        'nombre,email\n,sin-nombre@correo.com\nCarla,correo-invalido\nPedro,pedro@correo.com\n',
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].name).toBe('Pedro');
      expect(result.errors).toEqual([
        'Fila 2: falta el nombre.',
        'Fila 3: correo inválido (correo-invalido).',
      ]);
    });

    it('debe rechazar archivos vacíos o sin columnas reconocibles', () => {
      expect(parseCompanyClientsCsv('   ')).toEqual({
        rows: [],
        errors: ['El archivo está vacío.'],
      });
      expect(parseCompanyClientsCsv('foo,bar\n1,2')).toEqual({
        rows: [],
        errors: ['El archivo no tiene una columna de nombre, teléfono o correo.'],
      });
    });

    it('debe reportar un archivo solo con encabezados', () => {
      expect(parseCompanyClientsCsv('nombre,email\n')).toEqual({
        rows: [],
        errors: ['No se encontraron filas con datos.'],
      });
    });

    it('debe ignorar filas vacías y truncar campos largos', () => {
      const longName = 'a'.repeat(100);
      const result = parseCompanyClientsCsv(
        `nombre,telefono,email\n\n${longName},123,ok@correo.com\n`,
      );

      expect(result.errors).toEqual([]);
      expect(result.rows[0].name).toHaveLength(80);
      expect(result.rows[0].phone).toBe('123');
    });

    it('debe rechazar correos de más de 120 caracteres', () => {
      const longEmail = `${'a'.repeat(115)}@correo.com`;
      const result = parseCompanyClientsCsv(`nombre,email\nCarla,${longEmail}\n`);

      expect(result.rows).toEqual([]);
      expect(result.errors[0]).toContain('supera 120 caracteres');
    });
  });
});
