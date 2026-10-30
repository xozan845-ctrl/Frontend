import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../../../environments/environment';
import { CompanyCatalogOperationsService } from './company-catalog-operations.service';

const settingsRaw = {
  empresa_id: 'e-1',
  metodo_costeo: 'promedio',
  permitir_stock_negativo: false,
  alerta_stock_bajo: true,
  actualizar_costo_en_compra: true,
  unidad_defecto: 'Unidad (u)',
  actualizado_en: '2026-10-27T00:00:00.000Z',
};

const comboRaw = {
  id: 'combo-1',
  empresa_id: 'e-1',
  sku: 'COMBO-1',
  nombre: 'Desayuno',
  descripcion: '',
  codigo_barras: '',
  precio: '150.00',
  costo_total: '90.00',
  margen: 40,
  estado: 'activo',
  componentes: [
    {
      producto_id: 'p-1',
      sku: 'SKU-1',
      nombre: 'Café',
      cantidad: 1,
      costo_unitario: '90.00',
      subtotal: '90.00',
    },
  ],
  creado_en: '2026-10-27T00:00:00.000Z',
  actualizado_en: '2026-10-27T00:00:00.000Z',
};

const promotionRaw = {
  id: 'promo-1',
  empresa_id: 'e-1',
  nombre: '2x1',
  tipo: '2x1',
  producto_id: null,
  sku: '',
  cantidad_requerida: null,
  cantidad_gratis: null,
  descuento_porcentaje: null,
  fecha_desde: '2026-10-01',
  fecha_hasta: '2026-10-31',
  estado: 'activo',
  creado_en: '2026-10-27T00:00:00.000Z',
  actualizado_en: '2026-10-27T00:00:00.000Z',
};

const movementRaw = {
  id: 'mov-1',
  empresa_id: 'e-1',
  tipo: 'entrada',
  motivo: 'Compra',
  referencia: 'MOV-1',
  ubicacion_origen: '',
  ubicacion_destino: '',
  lineas: [{ producto_id: 'p-1', sku: 'SKU-1', nombre: 'Café', cantidad: 2 }],
  creado_por: null,
  creado_en: '2026-10-27T00:00:00.000Z',
};

describe('CompanyCatalogOperationsService', () => {
  let service: CompanyCatalogOperationsService;
  let httpMock: HttpTestingController;
  const originalApiUrl = environment.apiUrl;

  beforeEach(() => {
    environment.apiUrl = 'https://api.test';
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CompanyCatalogOperationsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    environment.apiUrl = originalApiUrl;
    httpMock.verify();
  });

  it('debe cargar y guardar la configuración de inventario', () => {
    let loaded: unknown;
    service.getInventorySettings().subscribe((value) => (loaded = value));
    httpMock.expectOne('https://api.test/catalog/configuracion-inventario').flush(settingsRaw);
    expect(loaded).toMatchObject({ costMethod: 'promedio', defaultUnit: 'Unidad (u)' });

    service
      .saveInventorySettings({
        costMethod: 'fifo',
        allowNegativeStock: true,
        lowStockAlert: false,
        updateCostOnPurchase: true,
        defaultUnit: 'Caja',
      })
      .subscribe();
    const request = httpMock.expectOne('https://api.test/catalog/configuracion-inventario');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toMatchObject({ metodo_costeo: 'fifo', unidad_defecto: 'Caja' });
    request.flush(settingsRaw);
  });

  it('debe listar combos recorriendo todas las páginas', () => {
    let combos: unknown;
    service.listCombos().subscribe((value) => (combos = value));

    httpMock
      .expectOne(
        (request) =>
          request.url === 'https://api.test/catalog/combos' &&
          request.params.get('limite') === '100' &&
          !request.params.has('pagina'),
      )
      .flush({ items: [comboRaw], paginas: 2, total: 2, pagina: 1, limite: 100 });
    httpMock
      .expectOne(
        (request) =>
          request.url === 'https://api.test/catalog/combos' && request.params.get('pagina') === '2',
      )
      .flush({
        items: [{ ...comboRaw, id: 'combo-2', sku: 'COMBO-2' }],
        paginas: 2,
        total: 2,
        pagina: 2,
        limite: 100,
      });

    expect(combos).toHaveLength(2);
  });

  it('debe crear, actualizar y eliminar combos', () => {
    const form = {
      sku: 'COMBO-1',
      name: 'Desayuno',
      description: '',
      barcode: '',
      price: '150.00',
      status: 'activo' as const,
      components: [{ productId: 'p-1', sku: 'SKU-1', name: 'Café', quantity: 1 }],
    };

    service.createCombo(form).subscribe();
    const create = httpMock.expectOne('https://api.test/catalog/combos');
    expect(create.request.method).toBe('POST');
    expect(create.request.body).toMatchObject({
      sku: 'COMBO-1',
      componentes: [{ sku: 'SKU-1', cantidad: 1 }],
    });
    create.flush(comboRaw);

    service.updateCombo('combo-1', form).subscribe();
    const update = httpMock.expectOne('https://api.test/catalog/combos/combo-1');
    expect(update.request.method).toBe('PATCH');
    expect(update.request.body).not.toHaveProperty('sku');
    update.flush(comboRaw);

    let removed = false;
    service.removeCombo('combo-1').subscribe({ complete: () => (removed = true) });
    httpMock.expectOne('https://api.test/catalog/combos/combo-1').flush(null);
    expect(removed).toBe(true);
  });

  it('debe listar, crear, actualizar y eliminar promociones', () => {
    service.listPromotions().subscribe();
    httpMock
      .expectOne(
        (request) =>
          request.url === 'https://api.test/catalog/promociones' &&
          request.params.get('limite') === '100',
      )
      .flush({ items: [promotionRaw], paginas: 1, total: 1, pagina: 1, limite: 100 });

    const form = {
      name: '2x1',
      type: '2x1' as const,
      productId: '',
      sku: '',
      requiredQuantity: null,
      freeQuantity: null,
      discountPercentage: null,
      from: '2026-10-01',
      to: '2026-10-31',
      status: 'activo' as const,
    };
    service.createPromotion(form).subscribe();
    httpMock.expectOne('https://api.test/catalog/promociones').flush(promotionRaw);

    service.updatePromotion('promo-1', form).subscribe();
    httpMock.expectOne('https://api.test/catalog/promociones/promo-1').flush(promotionRaw);

    service.removePromotion('promo-1').subscribe();
    httpMock.expectOne('https://api.test/catalog/promociones/promo-1').flush(null);
  });

  it('debe listar y registrar movimientos', () => {
    service.listMovements().subscribe();
    httpMock
      .expectOne(
        (request) =>
          request.url === 'https://api.test/catalog/inventario/movimientos' &&
          request.params.get('limite') === '100',
      )
      .flush({ items: [movementRaw], paginas: 1, total: 1, pagina: 1, limite: 100 });

    service
      .createMovement({
        type: 'entrada',
        reason: 'Compra',
        reference: 'MOV-1',
        origin: '',
        destination: '',
        lines: [{ productId: 'p-1', sku: 'SKU-1', name: 'Café', quantity: 2 }],
      })
      .subscribe();
    const request = httpMock.expectOne('https://api.test/catalog/inventario/movimientos');
    expect(request.request.method).toBe('POST');
    request.flush(movementRaw);
  });

  it('debe importar filas y escanear códigos', () => {
    service
      .importProducts([
        {
          sku: 'SKU-1',
          name: 'Café',
          description: '',
          category: '',
          basePrice: '100.00',
          stock: 2,
          cost: '',
          brand: '',
          barcode: '',
          unit: 'Unidad (u)',
          minStock: 0,
          maxStock: null,
          isRawMaterial: false,
          location: '',
        },
      ])
      .subscribe();
    const importRequest = httpMock.expectOne('https://api.test/catalog/productos/importar');
    expect(importRequest.request.body).toMatchObject({ filas: [{ sku: 'SKU-1' }] });
    importRequest.flush({ importados: 1, omitidos: 0, errores: [] });

    service.scan('750123').subscribe();
    const scanRequest = httpMock.expectOne(
      (request) =>
        request.url === 'https://api.test/catalog/escanear' &&
        request.params.get('codigo') === '750123',
    );
    scanRequest.flush({ tipo: 'producto', producto: { id: 'p-1', nombre: 'Café', sku: 'SKU-1' } });
  });

  it('debe traducir errores y rechazar respuestas vacías', () => {
    const errors: string[] = [];
    service
      .getInventorySettings()
      .subscribe({ error: (error: Error) => errors.push(error.message) });
    httpMock
      .expectOne('https://api.test/catalog/configuracion-inventario')
      .flush({ mensaje: 'config falló' }, { status: 400, statusText: 'Bad Request' });

    service.listCombos().subscribe({ error: (error: Error) => errors.push(error.message) });
    httpMock
      .expectOne((request) => request.url === 'https://api.test/catalog/combos')
      .flush({}, { status: 500, statusText: 'Server Error' });

    service
      .createCombo({
        sku: 'C-1',
        name: 'Combo',
        description: '',
        barcode: '',
        price: '1.00',
        status: 'activo',
        components: [{ productId: '', sku: 'SKU-1', name: '', quantity: 1 }],
      })
      .subscribe({ error: (error: Error) => errors.push(error.message) });
    httpMock.expectOne('https://api.test/catalog/combos').flush({});

    service.scan('x').subscribe({ error: (error: Error) => errors.push(error.message) });
    httpMock
      .expectOne((request) => request.url === 'https://api.test/catalog/escanear')
      .flush({ tipo: 'producto' });

    expect(errors[0]).toBe('config falló');
    expect(errors[1]).toBe('No se pudo cargar la información.');
    expect(errors[2]).toBe('No se pudo interpretar el combo.');
    expect(errors[3]).toContain('No se encontró');
  });

  it('debe emitir error cuando no hay apiUrl', () => {
    environment.apiUrl = '';
    const errors: Error[] = [];

    service.getInventorySettings().subscribe({ error: (error: Error) => errors.push(error) });
    service.listCombos().subscribe({ error: (error: Error) => errors.push(error) });
    service.listPromotions().subscribe({ error: (error: Error) => errors.push(error) });
    service.listMovements().subscribe({ error: (error: Error) => errors.push(error) });
    service.importProducts([]).subscribe({ error: (error: Error) => errors.push(error) });
    service.scan('x').subscribe({ error: (error: Error) => errors.push(error) });

    expect(errors).toHaveLength(6);
    expect(errors.every((error) => error.message.includes('apiUrl no configurado'))).toBe(true);
  });
});

describe('CompanyCatalogOperationsService · errores de mutación', () => {
  let service: CompanyCatalogOperationsService;
  let httpMock: HttpTestingController;
  const originalApiUrl = environment.apiUrl;

  beforeEach(() => {
    environment.apiUrl = 'https://api.test';
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CompanyCatalogOperationsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    environment.apiUrl = originalApiUrl;
    httpMock.verify();
  });

  it('debe traducir fallos de configuración, combos, promociones y movimientos', () => {
    const errors: string[] = [];

    service
      .saveInventorySettings({
        costMethod: 'fifo',
        allowNegativeStock: false,
        lowStockAlert: true,
        updateCostOnPurchase: true,
        defaultUnit: 'Unidad (u)',
      })
      .subscribe({ error: (error: Error) => errors.push(error.message) });
    httpMock
      .expectOne('https://api.test/catalog/configuracion-inventario')
      .flush({ mensaje: 'config falló' }, { status: 400, statusText: 'Bad Request' });

    service
      .updateCombo('combo-1', {
        sku: 'C-1',
        name: 'Combo',
        description: '',
        barcode: '',
        price: '1.00',
        status: 'activo',
        components: [{ productId: '', sku: 'SKU-1', name: '', quantity: 1 }],
      })
      .subscribe({ error: (error: Error) => errors.push(error.message) });
    httpMock
      .expectOne('https://api.test/catalog/combos/combo-1')
      .flush({}, { status: 500, statusText: 'Server Error' });

    service
      .removeCombo('combo-1')
      .subscribe({ error: (error: Error) => errors.push(error.message) });
    httpMock
      .expectOne('https://api.test/catalog/combos/combo-1')
      .flush({ mensaje: 'baja falló' }, { status: 409, statusText: 'Conflict' });

    service
      .updatePromotion('promo-1', {
        name: 'Promo',
        type: '2x1',
        productId: '',
        sku: '',
        requiredQuantity: null,
        freeQuantity: null,
        discountPercentage: null,
        from: '2026-10-01',
        to: '2026-10-31',
        status: 'activo',
      })
      .subscribe({ error: (error: Error) => errors.push(error.message) });
    httpMock
      .expectOne('https://api.test/catalog/promociones/promo-1')
      .flush({}, { status: 500, statusText: 'Server Error' });

    service
      .createMovement({
        type: 'entrada',
        reason: '',
        reference: '',
        origin: '',
        destination: '',
        lines: [{ productId: '', sku: 'SKU-1', name: '', quantity: 1 }],
      })
      .subscribe({ error: (error: Error) => errors.push(error.message) });
    httpMock
      .expectOne('https://api.test/catalog/inventario/movimientos')
      .flush({}, { status: 500, statusText: 'Server Error' });

    expect(errors).toEqual([
      'config falló',
      'No se pudo actualizar el combo.',
      'baja falló',
      'No se pudo actualizar la promoción.',
      'No se pudo registrar el movimiento.',
    ]);
  });

  it('debe rechazar respuestas de promoción y movimiento no interpretables', () => {
    const errors: string[] = [];

    service
      .createPromotion({
        name: 'Promo',
        type: '2x1',
        productId: '',
        sku: '',
        requiredQuantity: null,
        freeQuantity: null,
        discountPercentage: null,
        from: '2026-10-01',
        to: '2026-10-31',
        status: 'activo',
      })
      .subscribe({ error: (error: Error) => errors.push(error.message) });
    httpMock.expectOne('https://api.test/catalog/promociones').flush({});

    service
      .createMovement({
        type: 'entrada',
        reason: '',
        reference: '',
        origin: '',
        destination: '',
        lines: [{ productId: '', sku: 'SKU-1', name: '', quantity: 1 }],
      })
      .subscribe({ error: (error: Error) => errors.push(error.message) });
    httpMock.expectOne('https://api.test/catalog/inventario/movimientos').flush({});

    expect(errors).toEqual([
      'No se pudo interpretar la promoción.',
      'No se pudo interpretar el movimiento.',
    ]);
  });

  it('debe fallar al eliminar promociones con error del backend', () => {
    const errors: string[] = [];
    service
      .removePromotion('promo-1')
      .subscribe({ error: (error: Error) => errors.push(error.message) });
    httpMock
      .expectOne('https://api.test/catalog/promociones/promo-1')
      .flush({ mensaje: 'no se puede' }, { status: 409, statusText: 'Conflict' });

    service.importProducts([]).subscribe({ error: (error: Error) => errors.push(error.message) });
    httpMock
      .expectOne('https://api.test/catalog/productos/importar')
      .flush({}, { status: 500, statusText: 'Server Error' });

    expect(errors).toEqual(['no se puede', 'No se pudo importar el archivo.']);
  });
});
