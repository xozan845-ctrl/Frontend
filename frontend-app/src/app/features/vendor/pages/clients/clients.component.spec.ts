import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import ClientsComponent from './clients.component';
import { CLIENT_REPOSITORY, ClientRepository } from '../../repositories/client.repository';
import { NotificationService } from '../../../../core/services/notification.service';
import { SeoService } from '../../../../core/services/seo.service';
import { Client } from '../../models/vendor-order.model';
import { ClientSearchStore } from '../../state/client-search/client-search.store';

const carla: Client = {
  id: 'vc-1',
  code: 'CL-00125',
  name: 'Carla López',
  phone: '+505 8765 4321',
  email: 'carla.lopez@correo.com',
};

const kemuel: Client = {
  id: 'vc-2',
  code: 'CL-00124',
  name: 'Kemuel Ruiz',
  phone: '+505 7777 1111',
  email: '',
};

const createdClient: Client = {
  id: 'vc-126',
  code: 'CL-00126',
  name: 'Salón Vero',
  phone: '',
  email: '',
};

describe('ClientsComponent (cartera)', () => {
  let clientRepo: ClientRepository;
  const notification = { showSuccess: vi.fn(), showError: vi.fn(), showInfo: vi.fn() };
  const seo = { setPage: vi.fn(), reset: vi.fn() };

  const setup = async () => {
    clientRepo = {
      searchClients: vi.fn(() => of([carla, kemuel])),
      createClient: vi.fn(() => of(createdClient)),
    };
    await TestBed.configureTestingModule({
      imports: [ClientsComponent],
      providers: [
        provideRouter([]),
        ClientSearchStore,
        { provide: CLIENT_REPOSITORY, useValue: clientRepo },
        { provide: NotificationService, useValue: notification },
        { provide: SeoService, useValue: seo },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(ClientsComponent);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    await vi.waitFor(() =>
      expect(host.querySelectorAll('[data-testid="client-row"]').length).toBe(2),
    );
    fixture.detectChanges();
    return { fixture, host };
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('debe cargar la cartera, pintar la tabla y fijar el SEO', async () => {
    const { host } = await setup();

    expect(seo.setPage).toHaveBeenCalledWith('Clientes — Panel del vendedor', expect.any(String));
    expect(clientRepo.searchClients).toHaveBeenCalledWith('');
    expect(host.querySelector('[data-testid="clients-count"]')?.textContent).toContain(
      '2 clientes',
    );

    const rows = host.querySelectorAll('[data-testid="client-row"]');
    expect(rows[0].textContent).toContain('Carla López');
    expect(rows[0].textContent).toContain('CL-00125');
    expect(rows[0].textContent).toContain('+505 8765 4321');
    expect(rows[1].textContent).toContain('Kemuel Ruiz');
  });

  it('debe filtrar con retardo y mostrar el vacío sin resultados', async () => {
    const { fixture, host } = await setup();
    vi.mocked(clientRepo.searchClients).mockReturnValue(of([]));

    const input = host.querySelector('[data-testid="clients-search"]') as HTMLInputElement;
    input.value = 'zzz';
    input.dispatchEvent(new Event('input'));

    await vi.waitFor(() =>
      expect(host.querySelector('[data-testid="clients-page-empty"]')).not.toBeNull(),
    );
    fixture.detectChanges();

    expect(host.textContent).toContain('Sin resultados para tu búsqueda');
    expect(host.querySelector('[data-testid="clients-count"]')?.textContent).toContain('0');
  });

  it('debe mostrar el error de búsqueda y reintentar la consulta actual', async () => {
    const { fixture, host } = await setup();
    vi.mocked(clientRepo.searchClients).mockReturnValue(throwError(() => new Error('sin red')));

    const input = host.querySelector('[data-testid="clients-search"]') as HTMLInputElement;
    input.value = 'carla';
    input.dispatchEvent(new Event('input'));

    await vi.waitFor(() =>
      expect(host.querySelector('[data-testid="clients-page-error"]')).not.toBeNull(),
    );
    expect(host.textContent).toContain('sin red');
    expect(notification.showError).toHaveBeenCalledWith('sin red');

    vi.mocked(clientRepo.searchClients).mockReturnValue(of([carla, kemuel]));
    (host.querySelector('[data-testid="retry-clients-page"]') as HTMLButtonElement).click();

    await vi.waitFor(() =>
      expect(host.querySelectorAll('[data-testid="client-row"]').length).toBe(2),
    );
    fixture.detectChanges();

    expect(clientRepo.searchClients).toHaveBeenLastCalledWith('carla');
  });

  it('debe crear un cliente, adelantarlo en la lista y cerrar el modal', async () => {
    const { fixture, host } = await setup();

    (host.querySelector('[data-testid="new-client"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    const dialog = host.querySelector('[data-testid="create-client-dialog"]') as HTMLElement;
    expect(dialog).not.toBeNull();

    const name = dialog.querySelector('[data-testid="client-name"]') as HTMLInputElement;
    name.value = 'Salón Vero';
    name.dispatchEvent(new Event('input'));
    (dialog.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));

    await vi.waitFor(() => expect(clientRepo.createClient).toHaveBeenCalledTimes(1));
    expect(clientRepo.createClient).toHaveBeenCalledWith({
      name: 'Salón Vero',
      phone: '',
      email: '',
    });
    expect(notification.showSuccess).toHaveBeenCalledWith('Cliente Salón Vero creado.');

    await vi.waitFor(() =>
      expect(host.querySelectorAll('[data-testid="client-row"]')[0].textContent).toContain(
        'Salón Vero',
      ),
    );
    fixture.detectChanges();

    expect(host.querySelector('[data-testid="create-client-dialog"]')).toBeNull();
  });

  it('debe cerrar el modal sin crear al cancelar', async () => {
    const { fixture, host } = await setup();

    (host.querySelector('[data-testid="new-client"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    const dialog = host.querySelector('[data-testid="create-client-dialog"]') as HTMLElement;
    (dialog.querySelector('[data-testid="cancel-client"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(host.querySelector('[data-testid="create-client-dialog"]')).toBeNull();
    expect(clientRepo.createClient).not.toHaveBeenCalled();
  });

  it('debe limpiar el buscador y el SEO al salir', async () => {
    const { fixture } = await setup();
    const store = TestBed.inject(ClientSearchStore);
    store.setQuery('carla');

    fixture.destroy();

    expect(store.query()).toBe('');
    expect(store.results()).toEqual([]);
    expect(seo.reset).toHaveBeenCalledTimes(1);
  });
});
