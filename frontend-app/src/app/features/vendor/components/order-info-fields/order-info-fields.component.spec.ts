import { TestBed } from '@angular/core/testing';
import { OrderInfoFieldsComponent } from './order-info-fields.component';
import { OrderDraftInfo } from '../../models/vendor-order.model';

const info: OrderDraftInfo = {
  storeId: 't-1',
  storeName: 'Kemuel Store — Km 5 Carretera Masaya',
  date: '2026-10-20',
  deliveryMethod: 'retiro_tienda',
};

describe('OrderInfoFieldsComponent', () => {
  const setup = async (value: OrderDraftInfo = info) => {
    await TestBed.configureTestingModule({
      imports: [OrderInfoFieldsComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(OrderInfoFieldsComponent);
    fixture.componentRef.setInput('info', value);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe mostrar la tienda y la fecha del borrador', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('[data-testid="store-label"]')?.textContent).toContain(
      'Kemuel Store',
    );
    expect((host.querySelector('[data-testid="order-date"]') as HTMLInputElement).value).toBe(
      '2026-10-20',
    );
    expect(
      (host.querySelector('[data-testid="delivery-pickup"]') as HTMLInputElement).checked,
    ).toBe(true);
  });

  it('debe caer a "Mi tienda" cuando el borrador no trae tienda', async () => {
    const fixture = await setup({ ...info, storeName: '' });

    expect(
      (fixture.nativeElement as HTMLElement).querySelector('[data-testid="store-label"]')
        ?.textContent,
    ).toContain('Mi tienda');
  });

  it('debe sincronizar la fecha del formulario cuando el borrador cambia', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;
    await vi.waitFor(() =>
      expect((host.querySelector('[data-testid="order-date"]') as HTMLInputElement).value).toBe(
        '2026-10-20',
      ),
    );

    fixture.componentRef.setInput('info', { ...info, date: '2026-11-01' });
    fixture.detectChanges();

    await vi.waitFor(() =>
      expect((host.querySelector('[data-testid="order-date"]') as HTMLInputElement).value).toBe(
        '2026-11-01',
      ),
    );
  });

  it('debe emitir el cambio de fecha', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;
    await vi.waitFor(() =>
      expect((host.querySelector('[data-testid="order-date"]') as HTMLInputElement).value).toBe(
        '2026-10-20',
      ),
    );
    const changes: Partial<OrderDraftInfo>[] = [];
    fixture.componentInstance.infoChange.subscribe((value) => changes.push(value));

    const dateInput = host.querySelector('[data-testid="order-date"]') as HTMLInputElement;
    dateInput.value = '2026-10-25';
    dateInput.dispatchEvent(new Event('input'));

    expect(changes).toEqual([{ date: '2026-10-25', deliveryMethod: 'retiro_tienda' }]);
  });

  it('debe emitir el cambio de método de entrega y pintar el pill activo', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;
    await vi.waitFor(() =>
      expect((host.querySelector('[data-testid="order-date"]') as HTMLInputElement).value).toBe(
        '2026-10-20',
      ),
    );
    const changes: Partial<OrderDraftInfo>[] = [];
    fixture.componentInstance.infoChange.subscribe((value) => changes.push(value));

    (host.querySelector('[data-testid="delivery-shipping"]') as HTMLInputElement).click();
    fixture.detectChanges();

    expect(changes.at(-1)).toEqual({ date: '2026-10-20', deliveryMethod: 'envio_domicilio' });
    expect(
      (host.querySelector('[data-testid="delivery-shipping-pill"]') as HTMLElement).className,
    ).toContain('bg-accent-600');
  });

  it('debe señalar la fecha vacía sin emitir el cambio', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;
    await vi.waitFor(() =>
      expect((host.querySelector('[data-testid="order-date"]') as HTMLInputElement).value).toBe(
        '2026-10-20',
      ),
    );
    const changes: Partial<OrderDraftInfo>[] = [];
    fixture.componentInstance.infoChange.subscribe((value) => changes.push(value));

    const dateInput = host.querySelector('[data-testid="order-date"]') as HTMLInputElement;
    dateInput.value = '';
    dateInput.dispatchEvent(new Event('input'));
    dateInput.dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    expect(changes).toEqual([]);
    expect(host.textContent).toContain('Elige una fecha');
    expect(dateInput.className).toContain('input-error');
  });
});
