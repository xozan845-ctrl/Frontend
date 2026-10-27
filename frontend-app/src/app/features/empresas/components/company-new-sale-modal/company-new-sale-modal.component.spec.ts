import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CompanyNewSaleModalComponent } from './company-new-sale-modal.component';
import type { CompanyClient } from '../../models/company-client.model';
import type { CompanyService } from '../../models/company-service.model';
import type { CatalogProduct } from '../../../products/public-api';
import type { CreateCompanySalePayload } from '../../models/company-sale.model';

const client: CompanyClient = {
  id: 'buyer-buyer-1',
  buyerId: 'buyer-1',
  name: 'Carla López',
  phone: '8888 1111',
  email: 'carla@correo.com',
  company: 'Norte',
  source: 'order',
  createdAt: '2026-10-01T12:00:00.000Z',
  ordersCount: 3,
  totalSpent: 600,
  averageTicket: 200,
  firstPurchaseAt: '2026-09-01T12:00:00.000Z',
  lastPurchaseAt: '2026-10-20T12:00:00.000Z',
  isActive: true,
  isNew: false,
  isFrequent: true,
  isInactive: false,
  status: 'frecuente',
};

const product: CatalogProduct = {
  id: 'p-1',
  companyId: 'empresa-1',
  sku: 'SKU-1',
  name: 'Café',
  description: '',
  category: 'Bebidas',
  basePrice: 150,
  stock: 10,
  status: 'disponible',
  createdAt: '2026-09-01T12:00:00.000Z',
};

const service: CompanyService = {
  id: 'srv-1',
  companyId: 'empresa-1',
  code: 'SRV-1',
  name: 'Instalación',
  description: '',
  category: 'Soporte',
  price: 300,
  durationMinutes: 60,
  status: 'activo',
  createdAt: '2026-09-01T12:00:00.000Z',
  updatedAt: '2026-09-01T12:00:00.000Z',
};

describe('CompanyNewSaleModalComponent', () => {
  const setup = async (open = true, error: string | null = null) => {
    await TestBed.configureTestingModule({
      imports: [CompanyNewSaleModalComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(CompanyNewSaleModalComponent);
    fixture.componentRef.setInput('open', open);
    fixture.componentRef.setInput('clients', [client]);
    fixture.componentRef.setInput('products', [product]);
    fixture.componentRef.setInput('services', [service]);
    fixture.componentRef.setInput('nextNumber', 'V-001163');
    fixture.componentRef.setInput('error', error);
    fixture.detectChanges();
    return fixture;
  };

  const query = (fixture: Awaited<ReturnType<typeof setup>>, testId: string) =>
    fixture.nativeElement.querySelector(`[data-testid="${testId}"]`) as HTMLElement | null;

  const click = async (fixture: Awaited<ReturnType<typeof setup>>, testId: string) => {
    query(fixture, testId)?.click();
    fixture.detectChanges();
    await fixture.whenStable();
  };

  const type = (fixture: Awaited<ReturnType<typeof setup>>, testId: string, value: string) => {
    const field = query(fixture, testId) as HTMLInputElement | HTMLTextAreaElement;
    field.value = value;
    field.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('no debe renderizar nada cuando está cerrado', async () => {
    const fixture = await setup(false);

    expect(query(fixture, 'company-new-sale-dialog')).toBeNull();
  });

  it('debe completar el asistente con consumidor final, producto y servicio', async () => {
    const fixture = await setup();
    let emitted: CreateCompanySalePayload | undefined;
    fixture.componentInstance.submitSale.subscribe((payload) => (emitted = payload));

    expect(fixture.nativeElement.textContent).toContain('V-001163');
    await click(fixture, 'new-sale-next');
    expect(fixture.nativeElement.textContent).toContain('Productos del catálogo');

    await click(fixture, 'new-sale-product');
    expect(fixture.nativeElement.textContent).toContain('Líneas agregadas');
    await click(fixture, 'new-sale-next');
    expect(fixture.nativeElement.textContent).toContain('Servicios de la empresa');

    await click(fixture, 'new-sale-service');
    await click(fixture, 'new-sale-next');
    expect(fixture.nativeElement.textContent).toContain('Resumen de la venta');

    type(fixture, 'new-sale-discount', '10');
    await click(fixture, 'new-sale-next');
    expect(fixture.nativeElement.textContent).toContain('Fecha y método de pago');

    await click(fixture, 'sale-payment-tarjeta');
    await click(fixture, 'new-sale-next');
    expect(fixture.nativeElement.textContent).toContain('Observaciones');

    type(fixture, 'new-sale-notes', '  Entregar mañana  ');
    await click(fixture, 'new-sale-next');

    expect(emitted).toMatchObject({
      client: { mode: 'final', name: 'Consumidor final' },
      paymentMethod: 'tarjeta',
      discountPercent: 10,
      notes: 'Entregar mañana',
    });
    expect(emitted?.lines).toHaveLength(2);
    expect(emitted?.lines[0]).toMatchObject({ name: 'Café', quantity: 1, subtotal: 150 });
    expect(emitted?.lines[1]).toMatchObject({ name: 'Instalación', subtotal: 300 });
  });

  it('debe registrar un cliente rápido y validar su nombre', async () => {
    const fixture = await setup();
    let emitted: CreateCompanySalePayload | undefined;
    fixture.componentInstance.submitSale.subscribe((payload) => (emitted = payload));

    await click(fixture, 'new-sale-client-quick');
    await click(fixture, 'new-sale-next');
    expect(query(fixture, 'company-new-sale-step-error')?.textContent).toContain(
      'Escribe al menos 2 caracteres',
    );

    type(fixture, 'new-sale-quick-name', '  Pedro Ruiz  ');
    type(fixture, 'new-sale-quick-phone', ' 8888 ');
    type(fixture, 'new-sale-quick-email', ' pedro@correo.com ');
    type(fixture, 'new-sale-quick-company', ' Norte ');
    await click(fixture, 'new-sale-next');
    await click(fixture, 'new-sale-product');
    await click(fixture, 'new-sale-next');
    await click(fixture, 'new-sale-next');
    await click(fixture, 'new-sale-next');
    await click(fixture, 'new-sale-next');
    await click(fixture, 'new-sale-next');

    expect(emitted?.client).toEqual({
      mode: 'quick',
      name: 'Pedro Ruiz',
      phone: '8888',
      email: 'pedro@correo.com',
      company: 'Norte',
    });
  });

  it('debe buscar y elegir un cliente existente', async () => {
    const fixture = await setup();
    let emitted: CreateCompanySalePayload | undefined;
    fixture.componentInstance.submitSale.subscribe((payload) => (emitted = payload));

    await click(fixture, 'new-sale-client-existing');
    type(fixture, 'new-sale-client-search', 'carla');
    fixture.detectChanges();

    const row = fixture.nativeElement.querySelector(
      '[data-testid="new-sale-client-option"]',
    ) as HTMLButtonElement | null;
    expect(row).not.toBeNull();
    row?.click();
    fixture.detectChanges();

    await click(fixture, 'new-sale-next');
    await click(fixture, 'new-sale-product');
    await click(fixture, 'new-sale-next');
    await click(fixture, 'new-sale-next');
    await click(fixture, 'new-sale-next');
    await click(fixture, 'new-sale-next');
    await click(fixture, 'new-sale-next');

    expect(emitted?.client).toMatchObject({
      mode: 'existing',
      clientId: 'buyer-buyer-1',
      name: 'Carla López',
    });
  });

  it('debe exigir al menos una línea antes del resumen', async () => {
    const fixture = await setup();

    await click(fixture, 'new-sale-next');
    await click(fixture, 'new-sale-next');
    expect(fixture.nativeElement.textContent).toContain('Servicios de la empresa');

    await click(fixture, 'new-sale-next');
    expect(query(fixture, 'company-new-sale-step-error')?.textContent).toContain(
      'Agrega al menos un producto o servicio',
    );
    expect(fixture.nativeElement.textContent).toContain('Servicios de la empresa');
  });

  it('debe ajustar cantidades y eliminar líneas', async () => {
    const fixture = await setup();

    await click(fixture, 'new-sale-next');
    await click(fixture, 'new-sale-product');
    await click(fixture, 'new-sale-product');
    expect(fixture.nativeElement.textContent).toContain('2');

    fixture.nativeElement.querySelector('[aria-label="Quitar una unidad de Café"]').click();
    fixture.detectChanges();
    fixture.nativeElement.querySelector('[aria-label="Agregar una unidad de Café"]').click();
    fixture.detectChanges();
    fixture.nativeElement.querySelector('[aria-label="Eliminar Café"]').click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Líneas agregadas');
  });

  it('debe bloquear los pasos no visitados y permitir volver a los visitados', async () => {
    const fixture = await setup();

    await click(fixture, 'new-sale-step-3');
    expect(fixture.nativeElement.textContent).toContain('¿A quién le vendes?');

    await click(fixture, 'new-sale-next');
    await click(fixture, 'new-sale-step-1');
    expect(fixture.nativeElement.textContent).toContain('¿A quién le vendes?');
  });

  it('debe mostrar error, estados vacíos y cerrar', async () => {
    const fixture = await setup(true, 'No se pudo registrar la venta.');
    let dismissed = false;
    fixture.componentInstance.dismiss.subscribe(() => (dismissed = true));

    expect(query(fixture, 'company-new-sale-error')?.textContent).toContain(
      'No se pudo registrar la venta.',
    );

    fixture.componentRef.setInput('products', []);
    fixture.componentRef.setInput('services', []);
    fixture.detectChanges();
    await click(fixture, 'new-sale-next');
    expect(fixture.nativeElement.textContent).toContain('No hay productos disponibles');
    await click(fixture, 'new-sale-next');
    expect(fixture.nativeElement.textContent).toContain('Aún no tienes servicios activos');

    await click(fixture, 'close-company-new-sale');
    expect(dismissed).toBe(true);
  });

  it('debe reiniciar el asistente al reabrir', async () => {
    const fixture = await setup();
    await click(fixture, 'new-sale-next');
    await click(fixture, 'new-sale-product');
    expect(fixture.nativeElement.textContent).toContain('Líneas agregadas');

    fixture.componentRef.setInput('open', false);
    fixture.detectChanges();
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('¿A quién le vendes?');
    expect(fixture.nativeElement.textContent).not.toContain('Líneas agregadas');
  });
});
