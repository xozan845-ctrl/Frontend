import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { InventoryStore } from './inventory.store';
import { INVENTORY_REPOSITORY, InventoryRepository } from '../../repositories/inventory.repository';
import { NotificationService } from '../../../../core/services/notification/notification.service';
import { InventoryLine } from '../../models/inventory.model';

const lines: InventoryLine[] = [
  {
    sku: 'SKU-001',
    name: 'Teclado Mecánico',
    stock: 12,
    available: 10,
    reserved: 2,
    status: 'disponible',
    basePrice: 1000,
    availableValueCents: 1000000,
    totalValueCents: 1200000,
  },
  {
    sku: 'SKU-002',
    name: 'Mouse Gamer',
    stock: 0,
    available: 0,
    reserved: 0,
    status: 'agotado',
    basePrice: 50,
    availableValueCents: 0,
    totalValueCents: 0,
  },
];

describe('InventoryStore', () => {
  let repo: InventoryRepository;
  const notification = { showSuccess: vi.fn(), showError: vi.fn(), showInfo: vi.fn() };

  const setup = () => {
    repo = { list: vi.fn(() => of(lines)) };
    TestBed.configureTestingModule({
      providers: [
        InventoryStore,
        { provide: INVENTORY_REPOSITORY, useValue: repo },
        { provide: NotificationService, useValue: notification },
      ],
    });
    return TestBed.inject(InventoryStore);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('debe cargar el inventario y derivar totales', async () => {
    const store = setup();

    store.load();

    await vi.waitFor(() => expect(store.lines()).toEqual(lines));
    expect(store.totalSkus()).toBe(2);
    expect(store.totalStock()).toBe(12);
    expect(store.totalAvailable()).toBe(10);
    expect(store.totalReserved()).toBe(2);
    expect(store.totalValueCents()).toBe(1200000);
    expect(store.loading()).toBe(false);
  });

  it('debe filtrar por texto y estado', async () => {
    const store = setup();
    store.load();
    await vi.waitFor(() => expect(store.lines()).toHaveLength(2));

    store.setQuery('teclado');
    expect(store.filteredLines()).toHaveLength(1);

    store.setQuery('');
    store.setStatus('agotado');
    expect(store.filteredLines()).toEqual([lines[1]]);
  });

  it('debe normalizar acentos al buscar', async () => {
    const store = setup();
    store.load();
    await vi.waitFor(() => expect(store.lines()).toHaveLength(2));

    store.setQuery('mecanico');
    expect(store.filteredLines()).toHaveLength(1);
  });

  it('debe registrar el error de carga sin mensaje', async () => {
    const store = setup();
    vi.mocked(repo.list).mockReturnValue(throwError(() => new Error('')));

    store.load();

    await vi.waitFor(() => expect(store.error()).toBe('No se pudo cargar el inventario.'));
    expect(store.loading()).toBe(false);
    expect(notification.showError).toHaveBeenCalled();
  });

  it('debe reintentar, limpiar y reiniciar', async () => {
    const store = setup();
    store.load();
    await vi.waitFor(() => expect(store.lines()).toEqual(lines));
    vi.mocked(repo.list).mockClear();

    store.refresh();
    await vi.waitFor(() => expect(repo.list).toHaveBeenCalledTimes(1));

    store.clearError();
    expect(store.error()).toBeNull();

    store.reset();
    expect(store.lines()).toEqual([]);
    expect(store.query()).toBe('');
  });
});
