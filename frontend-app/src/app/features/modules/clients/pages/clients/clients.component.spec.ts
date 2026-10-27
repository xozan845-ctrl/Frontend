import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import ClientsPageComponent from './clients.component';
import { CLIENTS_PAGE_CONFIG } from '../../../../../shared/clients/constants/clients-config.tokens';
import { ClientsStore } from '../../../../clients/public-api';
import { SeoService } from '../../../../../core/services/seo/seo.service';
import type {
  Client,
  ClientChip,
  ClientImportResult,
  ClientKpis,
  ClientMutationResult,
  ClientsTab,
} from '../../../../clients/public-api';

const client: Client = {
  id: 'buyer-buyer-1',
  buyerId: 'buyer-1',
  name: 'Carla López',
  phone: '+505 8888 8888',
  email: 'carla@correo.com',
  company: 'Distribuidora Norte',
  source: 'order',
  createdAt: '2026-10-17T12:00:00.000Z',
  ordersCount: 2,
  totalSpent: 350,
  averageTicket: 175,
  firstPurchaseAt: '2026-10-17T12:00:00.000Z',
  lastPurchaseAt: '2026-10-25T12:00:00.000Z',
  isActive: true,
  isNew: true,
  isFrequent: false,
  isInactive: false,
  status: 'nuevo',
};

const kpis: ClientKpis = {
  totalClients: 1,
  activeClients: 1,
  newThisMonth: 1,
  topClient: client,
  totalGenerated: 350,
  averageTicket: 175,
  totalOrders: 2,
};

describe('ClientsPageComponent', () => {
  const clients = signal<Client[]>([]);
  const filtered = signal<Client[]>([]);
  const kpi = signal<ClientKpis>({
    totalClients: 0,
    activeClients: 0,
    newThisMonth: 0,
    topClient: null,
    totalGenerated: 0,
    averageTicket: 0,
    totalOrders: 0,
  });
  const tab = signal<ClientsTab>('list');
  const chip = signal<ClientChip>('all');
  const search = signal('');
  const page = signal(1);
  const totalPages = signal(1);
  const loading = signal(false);
  const error = signal<string | null>(null);

  const store = {
    ordersLoading: loading.asReadonly(),
    error: error.asReadonly(),
    kpis: kpi.asReadonly(),
    tab: tab.asReadonly(),
    chip: chip.asReadonly(),
    search: search.asReadonly(),
    pagedClients: computed(() => filtered().slice((page() - 1) * 10, page() * 10)),
    hasClients: computed(() => clients().length > 0),
    hasFilteredClients: computed(() => filtered().length > 0),
    hasFilters: computed(() => search().trim().length > 0 || tab() !== 'list' || chip() !== 'all'),
    filteredCount: computed(() => filtered().length),
    currentPage: computed(() => Math.min(page(), totalPages())),
    pageCount: totalPages.asReadonly(),
    rangeStart: computed(() =>
      filtered().length === 0 ? 0 : (Math.min(page(), totalPages()) - 1) * 10 + 1,
    ),
    rangeEnd: computed(() => Math.min(Math.min(page(), totalPages()) * 10, filtered().length)),
    isFirstPage: computed(() => Math.min(page(), totalPages()) === 1),
    isLastPage: computed(() => Math.min(page(), totalPages()) >= totalPages()),
    loadOrders: vi.fn(),
    setSearch: vi.fn((value: string) => search.set(value)),
    setTab: vi.fn((value: ClientsTab) => tab.set(value)),
    setChip: vi.fn((value: ClientChip) => chip.set(value)),
    addLocalClient: vi.fn((): ClientMutationResult => ({ ok: true, clientId: 'cc-1' })),
    importCsv: vi.fn((): ClientImportResult => ({ imported: 1, skipped: 0, errors: [] })),
    clearFilters: vi.fn(() => {
      search.set('');
      tab.set('list');
      chip.set('all');
      page.set(1);
    }),
    nextPage: vi.fn(() => {
      if (page() < totalPages()) page.set(page() + 1);
    }),
    prevPage: vi.fn(() => {
      if (page() > 1) page.set(page() - 1);
    }),
  };

  const seo = { setPage: vi.fn(), reset: vi.fn() };

  const defaultConfig = {
    title: 'Clientes',
    subtitle: 'CRM compartido de prueba.',
    homeLabel: 'Inicio',
    homeLink: '/empresa/inicio',
    importEnabled: true,
  };

  const setup = async (pageConfig = defaultConfig) => {
    await TestBed.configureTestingModule({
      imports: [ClientsPageComponent],
      providers: [
        provideRouter([]),
        { provide: ClientsStore, useValue: store },
        { provide: SeoService, useValue: seo },
        { provide: CLIENTS_PAGE_CONFIG, useValue: pageConfig },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(ClientsPageComponent);
    fixture.detectChanges();
    return fixture;
  };

  const type = (fixture: Awaited<ReturnType<typeof setup>>, testId: string, value: string) => {
    const field = fixture.nativeElement.querySelector(
      `[data-testid="${testId}"]`,
    ) as HTMLInputElement;
    field.value = value;
    field.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  beforeEach(() => {
    vi.clearAllMocks();
    clients.set([]);
    filtered.set([]);
    kpi.set({
      totalClients: 0,
      activeClients: 0,
      newThisMonth: 0,
      topClient: null,
      totalGenerated: 0,
      averageTicket: 0,
      totalOrders: 0,
    });
    tab.set('list');
    chip.set('all');
    search.set('');
    page.set(1);
    totalPages.set(1);
    loading.set(false);
    error.set(null);
    TestBed.resetTestingModule();
  });

  it('debe cargar las compras al crear la página', async () => {
    await setup();

    expect(store.loadOrders).toHaveBeenCalled();
  });

  it('debe renderizar la configuración del workspace activo', async () => {
    const fixture = await setup({
      title: 'Mis clientes',
      subtitle: 'Cartera del vendedor.',
      homeLabel: 'Panel',
      homeLink: '/vendedor/inicio',
      importEnabled: false,
    });

    expect(fixture.nativeElement.textContent).toContain('Mis clientes');
    expect(fixture.nativeElement.textContent).toContain('Cartera del vendedor.');
    const home = fixture.nativeElement.querySelector('a[href="/vendedor/inicio"]');
    expect(home?.textContent).toContain('Panel');
    expect(fixture.nativeElement.querySelector('[data-testid="clients-import"]')).toBeNull();
  });

  it('debe mostrar KPIs, tabla y estado del cliente', async () => {
    clients.set([client]);
    filtered.set([client]);
    kpi.set(kpis);
    const fixture = await setup();

    expect(
      fixture.nativeElement.querySelector('[data-testid="clients-kpi-total"]').textContent,
    ).toContain('1');
    expect(
      fixture.nativeElement.querySelector('[data-testid="clients-kpi-top"]').textContent,
    ).toContain('Carla López');
    expect(
      fixture.nativeElement.querySelector('[data-testid="clients-kpi-total-generated"]')
        .textContent,
    ).toContain('C$350.00');
    expect(fixture.nativeElement.querySelectorAll('[data-testid="client-row"]')).toHaveLength(1);
    expect(fixture.nativeElement.textContent).toContain('Distribuidora Norte');
    expect(fixture.nativeElement.textContent).toContain('Nuevo');
  });

  it('debe cambiar de vista, chip y búsqueda', async () => {
    clients.set([client]);
    filtered.set([client]);
    const fixture = await setup();

    fixture.nativeElement
      .querySelector('[data-testid="clients-tab-top"]')
      .dispatchEvent(new Event('click'));
    expect(store.setTab).toHaveBeenCalledWith('top');

    fixture.nativeElement
      .querySelector('[data-testid="clients-chip-active"]')
      .dispatchEvent(new Event('click'));
    expect(store.setChip).toHaveBeenCalledWith('active');

    type(fixture, 'clients-search', 'carla');
    expect(store.setSearch).toHaveBeenCalledWith('carla');
  });

  it('debe abrir el modal y registrar un cliente', async () => {
    const fixture = await setup();

    fixture.nativeElement
      .querySelector('[data-testid="clients-new"]')
      .dispatchEvent(new Event('click'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-testid="client-dialog"]')).not.toBeNull();

    type(fixture, 'client-name', 'Pedro Ruiz');
    type(fixture, 'client-email', 'pedro@correo.com');
    (fixture.nativeElement.querySelector('app-client-modal form') as HTMLFormElement).dispatchEvent(
      new Event('submit'),
    );
    fixture.detectChanges();

    expect(store.addLocalClient).toHaveBeenCalledWith({
      name: 'Pedro Ruiz',
      phone: '',
      email: 'pedro@correo.com',
      company: '',
    });
    expect(fixture.nativeElement.querySelector('[data-testid="client-dialog"]')).toBeNull();
  });

  it('debe mantener el modal abierto y mostrar el error de duplicado', async () => {
    store.addLocalClient.mockReturnValueOnce({
      ok: false,
      message: 'Ya existe un cliente con ese correo.',
    });
    const fixture = await setup();

    fixture.nativeElement
      .querySelector('[data-testid="clients-new"]')
      .dispatchEvent(new Event('click'));
    fixture.detectChanges();
    type(fixture, 'client-name', 'Pedro Ruiz');
    (fixture.nativeElement.querySelector('app-client-modal form') as HTMLFormElement).dispatchEvent(
      new Event('submit'),
    );
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('[data-testid="client-modal-error"]').textContent,
    ).toContain('Ya existe un cliente con ese correo.');
    expect(fixture.nativeElement.querySelector('[data-testid="client-dialog"]')).not.toBeNull();
  });

  it('debe importar un archivo CSV y mostrar el error si no importa filas', async () => {
    store.importCsv.mockReturnValueOnce({
      imported: 0,
      skipped: 1,
      errors: ['El archivo está vacío.'],
    });
    const fixture = await setup();
    const fileInput = fixture.nativeElement.querySelector(
      '[data-testid="clients-import-input"]',
    ) as HTMLInputElement;
    const file = new File(['nombre,email\nCarla,carla@correo.com\n'], 'clientes.csv', {
      type: 'text/csv',
    });
    Object.defineProperty(fileInput, 'files', { value: [file], configurable: true });
    fileInput.dispatchEvent(new Event('change'));

    await vi.waitFor(() =>
      expect(store.importCsv).toHaveBeenCalledWith('nombre,email\nCarla,carla@correo.com\n'),
    );
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('[data-testid="clients-import-error"]').textContent,
    ).toContain('El archivo está vacío.');
  });

  it('debe mostrar el estado vacío y abrir el alta desde ahí', async () => {
    const fixture = await setup();

    expect(fixture.nativeElement.querySelector('[data-testid="clients-empty"]')).not.toBeNull();

    fixture.nativeElement
      .querySelector('[data-testid="clients-empty-new"]')
      .dispatchEvent(new Event('click'));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="client-dialog"]')).not.toBeNull();
  });

  it('debe mostrar sin resultados y limpiar filtros', async () => {
    clients.set([client]);
    filtered.set([]);
    tab.set('top');
    const fixture = await setup();

    expect(
      fixture.nativeElement.querySelector('[data-testid="clients-no-results"]'),
    ).not.toBeNull();

    fixture.nativeElement
      .querySelector('[data-testid="clients-clear-filters"]')
      .dispatchEvent(new Event('click'));

    expect(store.clearFilters).toHaveBeenCalled();
  });

  it('debe mostrar carga, error y reintentar', async () => {
    loading.set(true);
    const fixture = await setup();
    expect(fixture.nativeElement.querySelector('[role="status"]')).not.toBeNull();

    loading.set(false);
    error.set('No se pudieron cargar los clientes.');
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('[data-testid="clients-error"]').textContent,
    ).toContain('No se pudieron cargar los clientes.');

    fixture.nativeElement
      .querySelector('[data-testid="clients-retry"]')
      .dispatchEvent(new Event('click'));
    expect(store.loadOrders).toHaveBeenCalled();
  });

  it('debe paginar y sincronizar', async () => {
    clients.set(Array.from({ length: 12 }, (_, index) => ({ ...client, id: `c-${index}` })));
    filtered.set(clients());
    totalPages.set(2);
    const fixture = await setup();

    expect(
      fixture.nativeElement.querySelector('[data-testid="clients-page"]').textContent,
    ).toContain('Página 1 de 2');

    fixture.nativeElement
      .querySelector('[data-testid="clients-next"]')
      .dispatchEvent(new Event('click'));
    fixture.detectChanges();
    expect(store.nextPage).toHaveBeenCalled();
    expect(
      fixture.nativeElement.querySelector('[data-testid="clients-page"]').textContent,
    ).toContain('Página 2 de 2');

    fixture.nativeElement
      .querySelector('[data-testid="clients-prev"]')
      .dispatchEvent(new Event('click'));
    expect(store.prevPage).toHaveBeenCalled();

    fixture.nativeElement
      .querySelector('[data-testid="clients-sync"]')
      .dispatchEvent(new Event('click'));
    expect(store.loadOrders).toHaveBeenCalledTimes(2);
  });
});
