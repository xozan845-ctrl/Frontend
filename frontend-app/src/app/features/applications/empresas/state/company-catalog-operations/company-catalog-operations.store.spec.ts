import { of, throwError } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { NotificationService } from '../../../../../core/services/notification/notification.service';
import { COMPANY_CATALOG_OPERATIONS_REPOSITORY } from '../../repositories/company-catalog-operations.repository';
import type {
  CompanyCombo,
  CompanyComboFormValue,
  CompanyInventoryMovement,
  CompanyInventoryMovementFormValue,
  CompanyInventorySettings,
  CompanyPromotion,
  CompanyPromotionFormValue,
  CompanyScanResult,
} from '../../models/company-catalog-operations.model';
import { CompanyCatalogOperationsStore } from './company-catalog-operations.store';

const settings: CompanyInventorySettings = {
  companyId: 'e-1',
  costMethod: 'promedio',
  allowNegativeStock: false,
  lowStockAlert: true,
  updateCostOnPurchase: true,
  defaultUnit: 'Unidad (u)',
  updatedAt: '2026-10-27T00:00:00.000Z',
};

const combo: CompanyCombo = {
  id: 'combo-1',
  companyId: 'e-1',
  sku: 'COMBO-1',
  name: 'Desayuno',
  description: '',
  barcode: '',
  price: 150,
  totalCost: 90,
  margin: 40,
  status: 'activo',
  components: [
    { productId: 'p-1', sku: 'SKU-1', name: 'Café', quantity: 1, unitCost: 90, subtotal: 90 },
  ],
  createdAt: '2026-10-27T00:00:00.000Z',
  updatedAt: '2026-10-27T00:00:00.000Z',
};

const comboForm: CompanyComboFormValue = {
  sku: 'COMBO-1',
  name: 'Desayuno',
  description: '',
  barcode: '',
  price: '150.00',
  status: 'activo',
  components: [{ productId: 'p-1', sku: 'SKU-1', name: 'Café', quantity: 1 }],
};

const promotion: CompanyPromotion = {
  id: 'promo-1',
  companyId: 'e-1',
  name: '2x1',
  type: '2x1',
  productId: null,
  sku: '',
  requiredQuantity: null,
  freeQuantity: null,
  discountPercentage: null,
  from: '2026-10-01',
  to: '2026-10-31',
  status: 'activo',
  createdAt: '2026-10-27T00:00:00.000Z',
  updatedAt: '2026-10-27T00:00:00.000Z',
};

const promotionForm: CompanyPromotionFormValue = {
  name: '2x1',
  type: '2x1',
  productId: '',
  sku: '',
  requiredQuantity: null,
  freeQuantity: null,
  discountPercentage: null,
  from: '2026-10-01',
  to: '2026-10-31',
  status: 'activo',
};

const movement: CompanyInventoryMovement = {
  id: 'mov-1',
  companyId: 'e-1',
  type: 'entrada',
  reason: 'Compra',
  reference: 'MOV-1',
  origin: '',
  destination: '',
  lines: [{ productId: 'p-1', sku: 'SKU-1', name: 'Café', quantity: 2 }],
  createdBy: '',
  createdAt: '2026-10-27T00:00:00.000Z',
};

const movementForm: CompanyInventoryMovementFormValue = {
  type: 'entrada',
  reason: 'Compra',
  reference: 'MOV-1',
  origin: '',
  destination: '',
  lines: [{ productId: 'p-1', sku: 'SKU-1', name: 'Café', quantity: 2 }],
};

const scanResult: CompanyScanResult = {
  kind: 'servicio',
  product: null,
  service: {
    id: 'srv-1',
    companyId: 'e-1',
    code: 'SRV-1',
    name: 'Soporte',
    description: '',
    category: '',
    brand: '',
    barcode: '',
    price: 100,
    cost: 0,
    unit: 'Hora (h)',
    durationMinutes: 60,
    status: 'activo',
    createdAt: '2026-10-27T00:00:00.000Z',
    updatedAt: '2026-10-27T00:00:00.000Z',
  },
};

describe('CompanyCatalogOperationsStore', () => {
  const notification = { showSuccess: vi.fn(), showError: vi.fn(), showInfo: vi.fn() };
  let repo: Record<string, ReturnType<typeof vi.fn>>;

  const setup = () => {
    repo = {
      getInventorySettings: vi.fn(() => of(settings)),
      saveInventorySettings: vi.fn(() => of({ ...settings, costMethod: 'fifo' })),
      listCombos: vi.fn(() => of([combo])),
      createCombo: vi.fn(() => of({ ...combo, id: 'combo-2', name: 'Nuevo' })),
      updateCombo: vi.fn(() => of({ ...combo, name: 'Actualizado' })),
      removeCombo: vi.fn(() => of(undefined)),
      listPromotions: vi.fn(() => of([promotion])),
      createPromotion: vi.fn(() => of({ ...promotion, id: 'promo-2' })),
      updatePromotion: vi.fn(() => of({ ...promotion, name: 'Actualizada' })),
      removePromotion: vi.fn(() => of(undefined)),
      listMovements: vi.fn(() => of([movement])),
      createMovement: vi.fn(() => of({ ...movement, id: 'mov-2' })),
      importProducts: vi.fn(() => of({ imported: 1, skipped: 0, errors: [] })),
      scan: vi.fn(() => of(scanResult)),
    };
    TestBed.configureTestingModule({
      providers: [
        CompanyCatalogOperationsStore,
        { provide: COMPANY_CATALOG_OPERATIONS_REPOSITORY, useValue: repo },
        { provide: NotificationService, useValue: notification },
      ],
    });
    return TestBed.inject(CompanyCatalogOperationsStore);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('debe cargar la configuración y guardarla', async () => {
    const store = setup();
    store.loadSettings();
    await vi.waitFor(() => expect(store.settings()).toEqual(settings));
    expect(store.settingsLoading()).toBe(false);

    store.saveSettings({
      costMethod: 'fifo',
      allowNegativeStock: true,
      lowStockAlert: false,
      updateCostOnPurchase: true,
      defaultUnit: 'Caja',
    });
    await vi.waitFor(() => expect(store.settingsSaved()).toBe(true));
    expect(store.settings()?.costMethod).toBe('fifo');
    expect(notification.showSuccess).toHaveBeenCalled();

    store.acknowledgeSettingsSaved();
    expect(store.settingsSaved()).toBe(false);
  });

  it('debe validar la configuración y reportar errores', async () => {
    const store = setup();
    store.saveSettings({
      costMethod: 'promedio',
      allowNegativeStock: false,
      lowStockAlert: true,
      updateCostOnPurchase: true,
      defaultUnit: '',
    });
    await vi.waitFor(() => expect(store.settingsError()).toContain('unidad'));

    repo['getInventorySettings'] = vi.fn(() => throwError(() => new Error('sin config')));
    store.loadSettings();
    await vi.waitFor(() => expect(store.settingsError()).toBe('sin config'));
  });

  it('debe listar, crear, actualizar y eliminar combos', async () => {
    const store = setup();
    store.loadCombos();
    await vi.waitFor(() => expect(store.comboCount()).toBe(1));
    expect(store.activeComboCount()).toBe(1);

    store.createCombo(comboForm);
    await vi.waitFor(() => expect(store.comboCount()).toBe(2));
    expect(store.lastComboSaved()?.id).toBe('combo-2');
    store.acknowledgeComboSaved();

    store.updateCombo({ id: 'combo-1', form: comboForm });
    await vi.waitFor(() =>
      expect(store.combos().find((item) => item.id === 'combo-1')?.name).toBe('Actualizado'),
    );

    store.removeCombo('combo-1');
    await vi.waitFor(() => expect(store.comboCount()).toBe(1));
    expect(store.lastComboRemovedId()).toBe('combo-1');
    store.acknowledgeComboRemoved();
    expect(store.lastComboRemovedId()).toBeNull();
  });

  it('debe validar combos antes de llamar al API', async () => {
    const store = setup();
    store.createCombo({ ...comboForm, components: [] });
    await vi.waitFor(() => expect(store.combosError()).toContain('producto'));

    store.clearCombosError();
    store.createCombo({ ...comboForm, price: 'gratis' });
    await vi.waitFor(() => expect(store.combosError()).toContain('precio'));

    store.removeCombo('no-existe');
    await vi.waitFor(() => expect(store.combosError()).toContain('no existe'));
    expect(repo['createCombo']).not.toHaveBeenCalled();
  });

  it('debe listar, crear, actualizar y eliminar promociones', async () => {
    const store = setup();
    store.loadPromotions();
    await vi.waitFor(() => expect(store.promotionCount()).toBe(1));
    expect(store.activePromotionCount()).toBe(1);

    store.createPromotion(promotionForm);
    await vi.waitFor(() => expect(store.promotionCount()).toBe(2));
    store.acknowledgePromotionSaved();

    store.updatePromotion({ id: 'promo-1', form: promotionForm });
    await vi.waitFor(() =>
      expect(store.promotions().find((item) => item.id === 'promo-1')?.name).toBe('Actualizada'),
    );

    store.removePromotion('promo-1');
    await vi.waitFor(() => expect(store.promotionCount()).toBe(1));
    expect(store.lastPromotionRemovedId()).toBe('promo-1');
    store.acknowledgePromotionRemoved();
  });

  it('debe validar promociones por tipo y fechas', async () => {
    const store = setup();
    store.createPromotion({ ...promotionForm, to: '2026-09-01' });
    await vi.waitFor(() => expect(store.promotionsError()).toContain('fecha final'));

    store.clearPromotionsError();
    store.createPromotion({
      ...promotionForm,
      type: 'descuento_porcentaje',
      discountPercentage: 0,
    });
    await vi.waitFor(() => expect(store.promotionsError()).toContain('descuento'));

    store.clearPromotionsError();
    store.createPromotion({ ...promotionForm, type: 'regalo', requiredQuantity: 0 });
    await vi.waitFor(() => expect(store.promotionsError()).toContain('cantidad'));
    expect(repo['createPromotion']).not.toHaveBeenCalled();
  });

  it('debe listar y registrar movimientos', async () => {
    const store = setup();
    store.loadMovements();
    await vi.waitFor(() => expect(store.movementCount()).toBe(1));

    store.createMovement(movementForm);
    await vi.waitFor(() => expect(store.movementCount()).toBe(2));
    expect(store.lastMovementSaved()?.id).toBe('mov-2');
    store.acknowledgeMovementSaved();
    expect(store.lastMovementSaved()).toBeNull();
  });

  it('debe validar movimientos y traslados', async () => {
    const store = setup();
    store.createMovement({ ...movementForm, lines: [] });
    await vi.waitFor(() => expect(store.movementsError()).toContain('línea'));

    store.clearMovementsError();
    store.createMovement({ ...movementForm, type: 'traslado', origin: '', destination: '' });
    await vi.waitFor(() => expect(store.movementsError()).toContain('origen'));

    store.clearMovementsError();
    store.createMovement({ ...movementForm, lines: [{ ...movementForm.lines[0], quantity: 0 }] });
    await vi.waitFor(() => expect(store.movementsError()).toContain('cantidad'));
    expect(repo['createMovement']).not.toHaveBeenCalled();
  });

  it('debe importar y escanear', async () => {
    const store = setup();
    store.importProducts([
      {
        sku: 'SKU-1',
        name: 'Café',
        description: '',
        category: '',
        basePrice: '100.00',
        stock: 1,
        cost: '',
        brand: '',
        barcode: '',
        unit: 'Unidad (u)',
        minStock: 0,
        maxStock: null,
        isRawMaterial: false,
        location: '',
      },
    ]);
    await vi.waitFor(() => expect(store.importResult()?.imported).toBe(1));

    store.scan('750');
    await vi.waitFor(() => expect(store.scanResult()?.kind).toBe('servicio'));
    expect(store.scanning()).toBe(false);

    store.clearImport();
    store.clearScan();
    expect(store.importResult()).toBeNull();
    expect(store.scanResult()).toBeNull();
  });

  it('debe validar importación y escaneo vacíos', async () => {
    const store = setup();
    store.importProducts([]);
    await vi.waitFor(() => expect(store.importError()).toContain('filas'));

    store.scan(' ');
    await vi.waitFor(() => expect(store.scanError()).toContain('código'));
  });

  it('debe reportar errores de red sin dejar filas falsas', async () => {
    const store = setup();
    repo['listCombos'] = vi.fn(() => throwError(() => new Error('combos fallaron')));
    store.loadCombos();
    await vi.waitFor(() => expect(store.combosError()).toBe('combos fallaron'));
    expect(store.combos()).toEqual([]);
  });

  it('debe reiniciar el estado', async () => {
    const store = setup();
    store.loadCombos();
    await vi.waitFor(() => expect(store.comboCount()).toBe(1));
    store.reset();
    expect(store.comboCount()).toBe(0);
    expect(store.settings()).toBeNull();
  });
});

describe('CompanyCatalogOperationsStore · errores y validaciones', () => {
  const notification = { showSuccess: vi.fn(), showError: vi.fn(), showInfo: vi.fn() };
  let repo: Record<string, ReturnType<typeof vi.fn>>;

  const setup = () => {
    repo = {
      getInventorySettings: vi.fn(() => of(settings)),
      saveInventorySettings: vi.fn(() => of(settings)),
      listCombos: vi.fn(() => of([])),
      createCombo: vi.fn(() => of(combo)),
      updateCombo: vi.fn(() => of(combo)),
      removeCombo: vi.fn(() => of(undefined)),
      listPromotions: vi.fn(() => of([])),
      createPromotion: vi.fn(() => of(promotion)),
      updatePromotion: vi.fn(() => of(promotion)),
      removePromotion: vi.fn(() => of(undefined)),
      listMovements: vi.fn(() => of([])),
      createMovement: vi.fn(() => of(movement)),
      importProducts: vi.fn(() => of({ imported: 1, skipped: 0, errors: [] })),
      scan: vi.fn(() => of(scanResult)),
    };
    TestBed.configureTestingModule({
      providers: [
        CompanyCatalogOperationsStore,
        { provide: COMPANY_CATALOG_OPERATIONS_REPOSITORY, useValue: repo },
        { provide: NotificationService, useValue: notification },
      ],
    });
    return TestBed.inject(CompanyCatalogOperationsStore);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('debe reportar errores de guardado y limpiarlos', async () => {
    const store = setup();
    repo['saveInventorySettings'] = vi.fn(() => throwError(() => new Error('guardado falló')));
    store.saveSettings({
      costMethod: 'fifo',
      allowNegativeStock: true,
      lowStockAlert: false,
      updateCostOnPurchase: true,
      defaultUnit: 'Caja',
    });
    await vi.waitFor(() => expect(store.settingsError()).toBe('guardado falló'));
    store.clearSettingsError();
    expect(store.settingsError()).toBeNull();
  });

  it('debe reportar errores de combos y limpiarlos', async () => {
    const store = setup();
    repo['createCombo'] = vi.fn(() => throwError(() => new Error('alta combo falló')));
    store.createCombo(comboForm);
    await vi.waitFor(() => expect(store.combosError()).toBe('alta combo falló'));
    store.clearCombosError();
    expect(store.combosError()).toBeNull();

    repo['updateCombo'] = vi.fn(() => throwError(() => new Error('edición combo falló')));
    store.updateCombo({ id: 'combo-1', form: comboForm });
    await vi.waitFor(() => expect(store.combosError()).toBe('edición combo falló'));

    repo['removeCombo'] = vi.fn(() => throwError(() => new Error('baja combo falló')));
    store.removeCombo('combo-1');
    await vi.waitFor(() => expect(store.combosError()).toContain('no existe'));
  });

  it('debe validar nombre, SKU y cantidades de combo', async () => {
    const store = setup();
    store.createCombo({ ...comboForm, sku: 'x' });
    await vi.waitFor(() => expect(store.combosError()).toContain('SKU'));

    store.clearCombosError();
    store.createCombo({ ...comboForm, name: '' });
    await vi.waitFor(() => expect(store.combosError()).toContain('nombre'));

    store.clearCombosError();
    store.createCombo({ ...comboForm, components: [{ ...comboForm.components[0], quantity: 0 }] });
    await vi.waitFor(() => expect(store.combosError()).toContain('cantidad'));
  });

  it('debe reportar errores de promociones', async () => {
    const store = setup();
    repo['listPromotions'] = vi.fn(() => throwError(() => new Error('listado promo falló')));
    store.loadPromotions();
    await vi.waitFor(() => expect(store.promotionsError()).toBe('listado promo falló'));

    repo['createPromotion'] = vi.fn(() => throwError(() => new Error('alta promo falló')));
    store.createPromotion(promotionForm);
    await vi.waitFor(() => expect(store.promotionsError()).toBe('alta promo falló'));

    repo['updatePromotion'] = vi.fn(() => throwError(() => new Error('edición promo falló')));
    store.updatePromotion({ id: 'promo-1', form: promotionForm });
    await vi.waitFor(() => expect(store.promotionsError()).toBe('edición promo falló'));

    repo['removePromotion'] = vi.fn(() => throwError(() => new Error('baja promo falló')));
    store.removePromotion('promo-1');
    await vi.waitFor(() => expect(store.promotionsError()).toContain('existe'));
    store.clearPromotionsError();
  });

  it('debe validar nombre, fechas y descuentos de promoción', async () => {
    const store = setup();
    store.createPromotion({ ...promotionForm, name: '' });
    await vi.waitFor(() => expect(store.promotionsError()).toContain('nombre'));

    store.clearPromotionsError();
    store.createPromotion({ ...promotionForm, from: '' });
    await vi.waitFor(() => expect(store.promotionsError()).toContain('fechas'));

    store.clearPromotionsError();
    store.createPromotion({
      ...promotionForm,
      type: 'descuento_porcentaje',
      discountPercentage: 101,
    });
    await vi.waitFor(() => expect(store.promotionsError()).toContain('descuento'));

    store.clearPromotionsError();
    store.createPromotion({
      ...promotionForm,
      type: 'descuento_cantidad',
      requiredQuantity: 1,
      freeQuantity: 0,
    });
    await vi.waitFor(() => expect(store.promotionsError()).toContain('gratis'));
  });

  it('debe reportar errores de movimientos', async () => {
    const store = setup();
    repo['listMovements'] = vi.fn(() => throwError(() => new Error('listado mov falló')));
    store.loadMovements();
    await vi.waitFor(() => expect(store.movementsError()).toBe('listado mov falló'));

    repo['createMovement'] = vi.fn(() => throwError(() => new Error('alta mov falló')));
    store.createMovement(movementForm);
    await vi.waitFor(() => expect(store.movementsError()).toBe('alta mov falló'));
    store.clearMovementsError();
  });

  it('debe validar cantidades de movimiento', async () => {
    const store = setup();
    store.createMovement({ ...movementForm, lines: [{ ...movementForm.lines[0], quantity: 0 }] });
    await vi.waitFor(() => expect(store.movementsError()).toContain('cantidad'));
  });

  it('debe reportar errores de importación y escaneo', async () => {
    const store = setup();
    repo['importProducts'] = vi.fn(() => throwError(() => new Error('import falló')));
    store.importProducts([
      {
        sku: 'SKU-1',
        name: 'Café',
        description: '',
        category: '',
        basePrice: '100.00',
        stock: 1,
        cost: '',
        brand: '',
        barcode: '',
        unit: 'Unidad (u)',
        minStock: 0,
        maxStock: null,
        isRawMaterial: false,
        location: '',
      },
    ]);
    await vi.waitFor(() => expect(store.importError()).toBe('import falló'));

    repo['scan'] = vi.fn(() => throwError(() => new Error('scan falló')));
    store.scan('750');
    await vi.waitFor(() => expect(store.scanError()).toBe('scan falló'));
  });

  it('debe rechazar más de 200 filas de importación', async () => {
    const store = setup();
    const rows = Array.from({ length: 201 }, (_, index) => ({
      sku: `SKU-${index}`,
      name: `Producto ${index}`,
      description: '',
      category: '',
      basePrice: '10.00',
      stock: 1,
      cost: '',
      brand: '',
      barcode: '',
      unit: 'Unidad (u)',
      minStock: 0,
      maxStock: null,
      isRawMaterial: false,
      location: '',
    }));
    store.importProducts(rows);
    await vi.waitFor(() => expect(store.importError()).toContain('200'));
  });
});

describe('CompanyCatalogOperationsStore · mensajes por defecto', () => {
  const notification = { showSuccess: vi.fn(), showError: vi.fn(), showInfo: vi.fn() };
  let repo: Record<string, ReturnType<typeof vi.fn>>;

  const setup = () => {
    repo = {
      getInventorySettings: vi.fn(() => of(settings)),
      saveInventorySettings: vi.fn(() => of(settings)),
      listCombos: vi.fn(() => of([combo])),
      createCombo: vi.fn(() => of(combo)),
      updateCombo: vi.fn(() => of(combo)),
      removeCombo: vi.fn(() => of(undefined)),
      listPromotions: vi.fn(() => of([promotion])),
      createPromotion: vi.fn(() => of(promotion)),
      updatePromotion: vi.fn(() => of(promotion)),
      removePromotion: vi.fn(() => of(undefined)),
      listMovements: vi.fn(() => of([movement])),
      createMovement: vi.fn(() => of(movement)),
      importProducts: vi.fn(() => of({ imported: 1, skipped: 0, errors: [] })),
      scan: vi.fn(() => of(scanResult)),
    };
    TestBed.configureTestingModule({
      providers: [
        CompanyCatalogOperationsStore,
        { provide: COMPANY_CATALOG_OPERATIONS_REPOSITORY, useValue: repo },
        { provide: NotificationService, useValue: notification },
      ],
    });
    return TestBed.inject(CompanyCatalogOperationsStore);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('usa mensajes por defecto cuando el error no trae texto', async () => {
    const store = setup();
    const emptyError = () => throwError(() => new Error(''));

    repo['getInventorySettings'] = vi.fn(emptyError);
    store.loadSettings();
    await vi.waitFor(() => expect(store.settingsError()).toContain('configuración'));

    repo['listCombos'] = vi.fn(emptyError);
    store.loadCombos();
    await vi.waitFor(() => expect(store.combosError()).toContain('combos'));

    repo['createCombo'] = vi.fn(emptyError);
    store.createCombo(comboForm);
    await vi.waitFor(() => expect(store.combosError()).toContain('crear el combo'));

    repo['updateCombo'] = vi.fn(emptyError);
    store.updateCombo({ id: 'combo-1', form: comboForm });
    await vi.waitFor(() => expect(store.combosError()).toContain('actualizar el combo'));

    repo['listCombos'] = vi.fn(() => of([combo]));
    store.loadCombos();
    await vi.waitFor(() => expect(store.comboCount()).toBe(1));
    repo['removeCombo'] = vi.fn(emptyError);
    store.removeCombo('combo-1');
    await vi.waitFor(() => expect(store.combosError()).toContain('eliminar el combo'));

    repo['listPromotions'] = vi.fn(emptyError);
    store.loadPromotions();
    await vi.waitFor(() => expect(store.promotionsError()).toContain('promociones'));

    repo['createPromotion'] = vi.fn(emptyError);
    store.createPromotion(promotionForm);
    await vi.waitFor(() => expect(store.promotionsError()).toContain('crear la promoción'));

    repo['updatePromotion'] = vi.fn(emptyError);
    store.updatePromotion({ id: 'promo-1', form: promotionForm });
    await vi.waitFor(() => expect(store.promotionsError()).toContain('actualizar la promoción'));

    repo['listPromotions'] = vi.fn(() => of([promotion]));
    store.loadPromotions();
    await vi.waitFor(() => expect(store.promotionCount()).toBe(1));
    repo['removePromotion'] = vi.fn(emptyError);
    store.removePromotion('promo-1');
    await vi.waitFor(() => expect(store.promotionsError()).toContain('eliminar la promoción'));

    repo['listMovements'] = vi.fn(emptyError);
    store.loadMovements();
    await vi.waitFor(() => expect(store.movementsError()).toContain('movimientos'));

    repo['createMovement'] = vi.fn(emptyError);
    store.createMovement(movementForm);
    await vi.waitFor(() => expect(store.movementsError()).toContain('registrar el movimiento'));

    repo['importProducts'] = vi.fn(emptyError);
    store.importProducts([
      {
        sku: 'SKU-1',
        name: 'Café',
        description: '',
        category: '',
        basePrice: '100.00',
        stock: 1,
        cost: '',
        brand: '',
        barcode: '',
        unit: 'Unidad (u)',
        minStock: 0,
        maxStock: null,
        isRawMaterial: false,
        location: '',
      },
    ]);
    await vi.waitFor(() => expect(store.importError()).toContain('importar'));

    repo['scan'] = vi.fn(emptyError);
    store.scan('750');
    await vi.waitFor(() => expect(store.scanError()).toContain('buscar el código'));
  });
});
