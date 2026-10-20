import { TestBed } from '@angular/core/testing';
import { BILLING_CLIENTS } from '../../constants/billing.fixtures';
import { ClientSearchCardComponent } from './client-search-card.component';

describe('ClientSearchCardComponent', () => {
  const setup = async (selectedId: string | null = null) => {
    await TestBed.configureTestingModule({
      imports: [ClientSearchCardComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(ClientSearchCardComponent);
    fixture.componentRef.setInput('results', [...BILLING_CLIENTS]);
    fixture.componentRef.setInput('query', '');
    fixture.componentRef.setInput(
      'selected',
      selectedId ? (BILLING_CLIENTS.find((c) => c.id === selectedId) ?? null) : null,
    );
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe emitir el término buscado y el cliente elegido', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;
    const queries: string[] = [];
    const selected: string[] = [];
    fixture.componentInstance.queryChange.subscribe((value) => queries.push(value));
    fixture.componentInstance.clientSelected.subscribe((client) => selected.push(client.id));

    const input = host.querySelector('[data-testid="billing-client-search"]') as HTMLInputElement;
    input.value = 'maría';
    input.dispatchEvent(new Event('input'));
    (
      host.querySelector('[data-testid="billing-client-option-cli-1"]') as HTMLButtonElement
    ).click();

    expect(queries).toEqual(['maría']);
    expect(selected).toEqual(['cli-1']);
  });

  it('debe mostrar el cliente elegido y permitir quitarlo', async () => {
    const fixture = await setup('cli-2');
    const host = fixture.nativeElement as HTMLElement;
    let cleared = 0;
    fixture.componentInstance.clearSelection.subscribe(() => (cleared += 1));

    expect(host.querySelector('[data-testid="billing-selected-client"]')?.textContent).toContain(
      'Carlos Méndez',
    );
    (host.querySelector('[data-testid="billing-clear-client"]') as HTMLButtonElement).click();
    expect(cleared).toBe(1);
  });

  it('debe mostrar el estado vacío y emitir el alta de cliente', async () => {
    const fixture = await setup();
    fixture.componentRef.setInput('results', []);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    let created = 0;
    fixture.componentInstance.createRequested.subscribe(() => (created += 1));

    expect(host.querySelector('[data-testid="billing-clients-empty"]')?.textContent).toContain(
      'No encontramos clientes',
    );
    (host.querySelector('[data-testid="billing-new-client"]') as HTMLButtonElement).click();
    expect(created).toBe(1);
  });
});
