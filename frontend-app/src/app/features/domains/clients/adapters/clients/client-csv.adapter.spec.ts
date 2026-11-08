import { parseClientsCsv } from './client-csv.adapter';

describe('parseClientsCsv', () => {
  it('debe leer un CSV con punto y coma, BOM y comillas', () => {
    const result = parseClientsCsv(
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
    const result = parseClientsCsv(
      'name,phone,email,company\n' + '"Carla ""La Jefa""",8888,carla@correo.com,"Norte\nCentral"\n',
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
    const result = parseClientsCsv('"Nombre ""Completo""",email\nCarla,carla@correo.com\n');

    expect(result.errors).toEqual([]);
    expect(result.rows[0]).toMatchObject({ name: 'Carla', email: 'carla@correo.com' });
  });

  it('debe leer un CSV separado por tabulador y derivar el nombre del correo', () => {
    const result = parseClientsCsv('email\ttelefono\tempresa\ncarla@correo.com\t8888\tNorte\n');

    expect(result.errors).toEqual([]);
    expect(result.rows[0]).toMatchObject({
      name: 'carla',
      phone: '8888',
      email: 'carla@correo.com',
      company: 'Norte',
    });
  });

  it('debe reportar filas sin nombre y correos inválidos', () => {
    const result = parseClientsCsv(
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
    expect(parseClientsCsv('   ')).toEqual({
      rows: [],
      errors: ['El archivo está vacío.'],
    });
    expect(parseClientsCsv('foo,bar\n1,2')).toEqual({
      rows: [],
      errors: ['El archivo no tiene una columna de nombre, teléfono o correo.'],
    });
  });

  it('debe reportar un archivo solo con encabezados', () => {
    expect(parseClientsCsv('nombre,email\n')).toEqual({
      rows: [],
      errors: ['No se encontraron filas con datos.'],
    });
  });

  it('debe ignorar filas vacías y truncar campos largos', () => {
    const longName = 'a'.repeat(100);
    const result = parseClientsCsv(`nombre,telefono,email\n\n${longName},123,ok@correo.com\n`);

    expect(result.errors).toEqual([]);
    expect(result.rows[0].name).toHaveLength(80);
    expect(result.rows[0].phone).toBe('123');
  });

  it('debe rechazar correos de más de 120 caracteres', () => {
    const longEmail = `${'a'.repeat(115)}@correo.com`;
    const result = parseClientsCsv(`nombre,email\nCarla,${longEmail}\n`);

    expect(result.rows).toEqual([]);
    expect(result.errors[0]).toContain('supera 120 caracteres');
  });
});
