import { TestBed } from '@angular/core/testing';
import { ClientOfDay } from '../../models/logistica.model';
import { ClientsTableComponent, whatsappUrl } from './clients-table.component';

const clients: readonly ClientOfDay[] = [
  {
    id: 1,
    name: 'María López',
    zone: 'Centro',
    address: 'Col. Centroamérica',
    phone: '+50588880001',
    routeNumber: 1,
    tone: 'blue',
  },
  {
    id: 5,
    name: 'Ana Torres',
    zone: 'Sur',
    address: 'Las Colinas',
    phone: '+50588880005',
    routeNumber: 4,
    tone: 'red',
  },
];

describe('ClientsTableComponent', () => {
  const setup = async (data: readonly ClientOfDay[] = clients, loading = false) => {
    await TestBed.configureTestingModule({ imports: [ClientsTableComponent] }).compileComponents();
    const fixture = TestBed.createComponent(ClientsTableComponent);
    fixture.componentRef.setInput('clients', data);
    fixture.componentRef.setInput('loading', loading);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe renderizar los clientes con zona, dirección y número de ruta', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;
    const rows = host.querySelectorAll('[data-testid="client-row"]');

    expect(rows).toHaveLength(2);
    expect(rows[0].textContent).toContain('María López');
    expect(rows[0].textContent).toContain('Centro');
    expect(rows[0].textContent).toContain('Col. Centroamérica');
    expect(rows[0].textContent).toContain('1');
  });

  it('debe enlazar llamada y WhatsApp con etiquetas accesibles (R-AC-1, R-SE-7)', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;

    const call = host.querySelector('[aria-label="Llamar a María López"]');
    const whatsapp = host.querySelector('[aria-label="Escribir por WhatsApp a María López"]');

    expect(call?.getAttribute('href')).toBe('tel:+50588880001');
    expect(whatsapp?.getAttribute('href')).toBe('https://wa.me/50588880001');
    expect(whatsapp?.getAttribute('rel')).toBe('noopener noreferrer');
    expect(whatsapp?.getAttribute('target')).toBe('_blank');
  });

  it('debe construir el enlace de WhatsApp solo con dígitos', () => {
    expect(whatsappUrl('+505 8888-0001')).toBe('https://wa.me/50588880001');
  });

  it('debe mostrar el vacío cuando la zona no tiene clientes', async () => {
    const fixture = await setup([]);
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('[data-testid="clients-empty"]')).not.toBeNull();
  });

  it('debe mostrar esqueletos mientras carga', async () => {
    const fixture = await setup(clients, true);
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelectorAll('[data-testid="client-row"]')).toHaveLength(0);
    expect(host.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });
});
