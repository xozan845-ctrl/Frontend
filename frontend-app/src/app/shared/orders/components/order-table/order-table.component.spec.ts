import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { OrderTableComponent } from './order-table.component';
import type { OrderTableColumn, OrderTableRow } from '../../models/order-table.model';

const rows: OrderTableRow[] = [
  {
    id: 'sale-1',
    number: 'V-001',
    date: '2026-10-27T12:00:00.000Z',
    clientName: 'Carla López',
    paymentLabel: 'Efectivo',
    productsLabel: 'Café',
    providerName: 'Tienda Norte',
    total: 150,
    profit: 15,
    status: 'pagada',
  },
];

const columns: OrderTableColumn[] = [
  { key: 'number', label: '# Venta' },
  { key: 'date', label: 'Fecha' },
  { key: 'client', label: 'Cliente' },
  { key: 'payment', label: 'Método' },
  { key: 'products', label: 'Productos' },
  { key: 'provider', label: 'Proveedor' },
  { key: 'total', label: 'Total', align: 'right' },
  { key: 'profit', label: 'Ganancia', align: 'right' },
  { key: 'status', label: 'Estado' },
];

describe('OrderTableComponent', () => {
  const setup = async (inputRows = rows, inputColumns = columns, withLink = false) => {
    await TestBed.configureTestingModule({
      imports: [OrderTableComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(OrderTableComponent);
    fixture.componentRef.setInput('rows', inputRows);
    fixture.componentRef.setInput('columns', inputColumns);
    fixture.componentRef.setInput('rowTestId', 'test-row');
    fixture.componentRef.setInput('tableTestId', 'test-table');
    if (withLink) {
      fixture.componentRef.setInput('rows', [
        { ...rows[0], numberHref: '/vendedor/pedidos/sale-1' },
      ]);
    }
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe pintar columnas, fila, moneda y estado', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('[data-testid="test-table"]')).not.toBeNull();
    expect(host.querySelectorAll('[data-testid="test-row"]')).toHaveLength(1);
    expect(host.textContent).toContain('Carla López');
    expect(host.textContent).toContain('C$150.00');
    expect(host.textContent).toContain('C$15.00');
    expect(host.textContent).toContain('Pagada');
    expect(host.textContent).toContain('Tienda Norte');
  });

  it('debe enlazar el número cuando hay numberHref', async () => {
    const fixture = await setup(rows, columns, true);
    const host = fixture.nativeElement as HTMLElement;
    const link = host.querySelector('[data-testid="order-link-sale-1"]') as HTMLAnchorElement;

    expect(link.getAttribute('href')).toBe('/vendedor/pedidos/sale-1');
    expect(link.textContent).toContain('V-001');
  });

  it('debe alinear a la derecha las columnas de importes', async () => {
    const fixture = await setup();
    const headers = fixture.nativeElement.querySelectorAll('th');

    expect(headers[6].className).toContain('text-right');
    expect(headers[7].className).toContain('text-right');
  });

  it('debe usar guiones y cero para datos opcionales ausentes', async () => {
    const fixture = await setup([
      {
        id: 'sale-2',
        number: 'V-002',
        date: '2026-10-27T12:00:00.000Z',
        clientName: 'Sin extras',
        total: 0,
        status: 'pendiente',
      },
    ]);
    const host = fixture.nativeElement as HTMLElement;
    const cells = host.querySelectorAll('tbody td');

    expect(cells[3].textContent).toContain('—');
    expect(cells[4].textContent).toContain('—');
    expect(cells[5].textContent).toContain('—');
    expect(cells[7].textContent).toContain('C$0.00');
  });

  it('debe aplicar los test ids por defecto', async () => {
    await TestBed.configureTestingModule({
      imports: [OrderTableComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(OrderTableComponent);
    fixture.componentRef.setInput('rows', rows);
    fixture.componentRef.setInput('columns', columns);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('[data-testid="order-table"]')).not.toBeNull();
    expect(host.querySelectorAll('[data-testid="order-table-row"]')).toHaveLength(1);
  });
});
