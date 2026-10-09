import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import CreateStoreComponent from './create-store.component';
import { StoreWizardStore } from '../../state/store-wizard.store';
import { STORE_REPOSITORY, StoreRepository } from '../../repositories/store.repository';
import { CATALOG_REPOSITORY, CatalogRepository } from '../../repositories/catalog.repository';
import { AuthStore } from '../../../auth/public-api';
import { NotificationService } from '../../../../core/services/notification.service';
import { SeoService } from '../../../../core/services/seo.service';
import type { User } from '../../../auth/public-api';

const createdStore = { id: 't-1', vendorId: 'v-1', name: 'Mi Tienda', description: '' };

describe('CreateStoreComponent', () => {
  let repo: StoreRepository;
  let catalogRepo: CatalogRepository;
  let currentUser: User | null;
  const authStore = {
    user: () => currentUser,
    isAuthenticated: () => currentUser !== null,
    loading: () => false,
    error: () => null,
    register: vi.fn(),
    clearSession: vi.fn(),
  };
  const notification = { showSuccess: vi.fn(), showError: vi.fn(), showInfo: vi.fn() };
  const seo = { setPage: vi.fn(), reset: vi.fn() };

  const setup = async () => {
    repo = {
      createStore: vi.fn(() => of(createdStore)),
      getMyStore: vi.fn(() => of(null)),
      publishOffer: vi.fn(() => of(undefined)),
    };
    catalogRepo = {
      listCatalog: vi.fn(() => of([{ id: 'p-1', name: 'Teclado', sku: 'SKU-1' }])),
    };
    await TestBed.configureTestingModule({
      imports: [CreateStoreComponent],
      providers: [
        provideRouter([]),
        StoreWizardStore,
        { provide: STORE_REPOSITORY, useValue: repo },
        { provide: CATALOG_REPOSITORY, useValue: catalogRepo },
        { provide: AuthStore, useValue: authStore },
        { provide: NotificationService, useValue: notification },
        { provide: SeoService, useValue: seo },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(CreateStoreComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    currentUser = null;
    TestBed.resetTestingModule();
  });

  it('debe registrar la cuenta como vendedor con datos válidos', async () => {
    const fixture = await setup();
    fixture.componentInstance.accountForm.setValue({
      name: 'Ana Pérez',
      email: 'ana@tienda.test',
      password: 'secreto123',
    });

    fixture.componentInstance.register();

    expect(authStore.register).toHaveBeenCalledWith({
      name: 'Ana Pérez',
      email: 'ana@tienda.test',
      password: 'secreto123',
      role: 'seller',
    });
  });

  it('no debe registrar con el formulario inválido', async () => {
    const fixture = await setup();
    fixture.componentInstance.accountForm.setValue({ name: '', email: 'x', password: '123' });

    fixture.componentInstance.register();

    expect(authStore.register).not.toHaveBeenCalled();
  });

  it('debe detectar una cuenta de comprador (no puede crear tienda)', async () => {
    currentUser = { id: 1, email: 'a@a.com', name: 'Ana', role: 'comprador' };
    const fixture = await setup();

    expect(fixture.componentInstance.isBuyer()).toBe(true);
    expect(fixture.componentInstance.isSeller()).toBe(false);
  });

  it('no debe crear la tienda si el formulario es inválido', async () => {
    const fixture = await setup();

    fixture.componentInstance.createStore();

    expect(repo.createStore).not.toHaveBeenCalled();
  });

  it('debe crear la tienda y avanzar al paso de productos', async () => {
    const fixture = await setup();
    fixture.componentInstance.storeForm.setValue({ name: 'Mi Tienda', description: 'Demo' });

    fixture.componentInstance.createStore();
    await vi.waitFor(() => expect(fixture.componentInstance.wizard.step()).toBe(3));

    expect(repo.createStore).toHaveBeenCalledWith({ name: 'Mi Tienda', description: 'Demo' });
    // Al entrar al paso 3 se carga el catálogo automáticamente.
    expect(catalogRepo.listCatalog).toHaveBeenCalled();
  });

  it('debe navegar a la tienda en el paso final', async () => {
    const fixture = await setup();
    fixture.componentInstance.wizard.createStore({ name: 'Mi Tienda', description: '' });
    await vi.waitFor(() => expect(fixture.componentInstance.wizard.store()).toEqual(createdStore));
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    fixture.componentInstance.goToStore();

    expect(navigate).toHaveBeenCalledWith(['/tienda', 't-1', 'shop']);
  });

  it('debe poder omitir la publicación de productos', async () => {
    const fixture = await setup();
    fixture.componentInstance.wizard.goToProductsStep();

    fixture.componentInstance.skipProducts();
    await vi.waitFor(() => expect(fixture.componentInstance.wizard.step()).toBe(4));

    expect(repo.publishOffer).not.toHaveBeenCalled();
  });

  it('debe exponer hasSelection como derivado al seleccionar un producto', async () => {
    const fixture = await setup();
    fixture.componentInstance.wizard.goToProductsStep();
    fixture.detectChanges();
    await vi.waitFor(() => expect(fixture.componentInstance.productRows.length).toBe(1));
    expect(fixture.componentInstance.hasSelection()).toBe(false);

    fixture.componentInstance.toggleRow(0);
    fixture.detectChanges();

    expect(fixture.componentInstance.hasSelection()).toBe(true);
  });

  it('debe mostrar el estado de error del catálogo con reintento', async () => {
    const fixture = await setup();
    vi.mocked(catalogRepo.listCatalog).mockReturnValue(throwError(() => new Error('boom')));
    fixture.componentInstance.wizard.goToProductsStep();
    fixture.detectChanges();
    await vi.waitFor(() => expect(fixture.componentInstance.wizard.error()).toBe('boom'));
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'No pudimos cargar el catálogo',
    );

    vi.mocked(catalogRepo.listCatalog).mockClear();
    fixture.componentInstance.retryCatalog();
    expect(catalogRepo.listCatalog).toHaveBeenCalled();
  });

  it('debe mostrar el error al crear la tienda con reintento', async () => {
    const fixture = await setup();
    vi.mocked(repo.createStore).mockReturnValue(
      throwError(() => new Error('No se pudo crear la tienda.')),
    );
    fixture.componentInstance.wizard.goToStoreStep();
    fixture.componentInstance.storeForm.setValue({ name: 'Mi Tienda', description: '' });
    fixture.detectChanges();

    fixture.componentInstance.createStore();
    await vi.waitFor(() => expect(fixture.componentInstance.wizard.error()).toBeDefined());
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'No se pudo crear la tienda.',
    );
  });

  it('debe restaurar el SEO al destruirse', async () => {
    const fixture = await setup();

    fixture.destroy();

    expect(seo.reset).toHaveBeenCalled();
  });
});
