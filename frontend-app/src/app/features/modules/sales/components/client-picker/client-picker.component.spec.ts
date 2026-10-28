import { TestBed } from '@angular/core/testing';
import { ClientPickerComponent } from './client-picker.component';
import type { Client } from '../../../../applications/vendor/public-api';

const carla: Client = {
  id: 'vc-1',
  code: 'CL-00125',
  name: 'Carla López',
  phone: '+505 8765 4321',
  email: 'carla.lopez@correo.com',
};

const kemuel: Client = { id: 'vc-2', code: 'CL-00124', name: 'Kemuel Store', phone: '', email: '' };

interface SetupOptions {
  selected?: Client | null;
  results?: Client[];
  query?: string;
  loading?: boolean;
  error?: string | null;
}

describe('ClientPickerComponent', () => {
  const setup = async (options: SetupOptions = {}) => {
    await TestBed.configureTestingModule({
      imports: [ClientPickerComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(ClientPickerComponent);
    fixture.componentRef.setInput('selected', options.selected ?? null);
    fixture.componentRef.setInput('results', options.results ?? [carla, kemuel]);
    fixture.componentRef.setInput('query', options.query ?? '');
    fixture.componentRef.setInput('loading', options.loading ?? false);
    fixture.componentRef.setInput('error', options.error ?? null);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe listar resultados con iniciales y emitir el cliente elegido', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;
    const selected: Client[] = [];
    fixture.componentInstance.clientSelected.subscribe((client) => selected.push(client));

    const options = host.querySelectorAll('[data-testid^="client-option-"]');
    expect(options).toHaveLength(2);
    expect(options[0].textContent).toContain('Carla López');
    expect(options[0].textContent).toContain('CL-00125');
    expect(options[0].textContent).toContain('CL');

    (options[0] as HTMLButtonElement).click();
    expect(selected).toEqual([carla]);
  });

  it('debe emitir el término digitado y el alta rápida', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;
    const queries: string[] = [];
    let createRequests = 0;
    fixture.componentInstance.queryChange.subscribe((value) => queries.push(value));
    fixture.componentInstance.createRequested.subscribe(() => createRequests++);

    const input = host.querySelector('[data-testid="client-search"]') as HTMLInputElement;
    input.value = 'ca';
    input.dispatchEvent(new Event('input'));
    (host.querySelector('[data-testid="new-client"]') as HTMLButtonElement).click();

    expect(queries).toEqual(['ca']);
    expect(createRequests).toBe(1);
  });

  it('debe mostrar la tarjeta del cliente seleccionado y poder quitarlo', async () => {
    const fixture = await setup({ selected: carla });
    const host = fixture.nativeElement as HTMLElement;
    let cleared = 0;
    fixture.componentInstance.clearSelection.subscribe(() => cleared++);

    const card = host.querySelector('[data-testid="selected-client"]') as HTMLElement;
    expect(card.textContent).toContain('Carla López');
    expect(card.textContent).toContain('+505 8765 4321');
    expect(host.querySelector('[data-testid="client-search"]')).toBeNull();

    (host.querySelector('[data-testid="clear-client"]') as HTMLButtonElement).click();
    expect(cleared).toBe(1);
  });

  it('debe mostrar skeletons mientras busca', async () => {
    const fixture = await setup({ loading: true });
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelectorAll('app-skeleton-loader').length).toBeGreaterThan(0);
    expect(host.querySelector('[data-testid="client-results"]')).toBeNull();
    expect(host.textContent).toContain('Buscando clientes…');
  });

  it('debe mostrar el error con acción de reintento', async () => {
    const fixture = await setup({ error: 'sin conexión' });
    const host = fixture.nativeElement as HTMLElement;
    let retries = 0;
    fixture.componentInstance.retry.subscribe(() => retries++);

    expect(host.querySelector('[data-testid="clients-error"]')?.textContent).toContain(
      'sin conexión',
    );

    (host.querySelector('[data-testid="retry-clients"]') as HTMLButtonElement).click();
    expect(retries).toBe(1);
  });

  it('debe mostrar el vacío cuando no hay coincidencias', async () => {
    const fixture = await setup({ results: [] });
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('[data-testid="clients-empty"]')).not.toBeNull();
  });
});
