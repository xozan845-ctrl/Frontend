import { TestBed } from '@angular/core/testing';
import { OrderDraftPanelComponent } from './order-draft-panel.component';
import type { OrderLineQuantityChange } from './order-draft-panel.types';
import type { OrderDraftLine } from '../../../../applications/vendor/public-api';

const line = (id: string, quantity: number): OrderDraftLine => ({
  product: {
    id,
    name: `Producto ${id}`,
    sku: `SKU-${id}`,
    category: 'General',
    price: 180,
    imageUrl: '',
    inStock: true,
  },
  quantity,
});

describe('OrderDraftPanelComponent', () => {
  const setup = async (
    lines: OrderDraftLine[] = [line('vp-1', 1), line('vp-2', 2)],
    submitting = false,
  ) => {
    await TestBed.configureTestingModule({
      imports: [OrderDraftPanelComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(OrderDraftPanelComponent);
    fixture.componentRef.setInput('lines', lines);
    fixture.componentRef.setInput('subtotal', 540);
    fixture.componentRef.setInput('discountPercent', 0);
    fixture.componentRef.setInput('discountAmount', 0);
    fixture.componentRef.setInput('taxAmount', 81);
    fixture.componentRef.setInput('total', 621);
    fixture.componentRef.setInput('observations', '');
    fixture.componentRef.setInput('submitting', submitting);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe renderizar líneas, conteo y totales', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelectorAll('[data-testid^="draft-line-"]')).toHaveLength(2);
    expect(host.querySelector('[data-testid="draft-count"]')?.textContent).toContain('2 productos');
    expect(host.querySelector('[data-testid="totals-total"]')?.textContent).toContain('C$621.00');
    expect(host.querySelector('[data-testid="draft-empty"]')).toBeNull();
  });

  it('debe mostrar el vacío y bloquear el registro sin líneas', async () => {
    const fixture = await setup([]);
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('[data-testid="draft-empty"]')).not.toBeNull();
    expect(host.querySelector('[data-testid="draft-count"]')?.textContent).toContain('0 productos');
    expect((host.querySelector('[data-testid="submit-order"]') as HTMLButtonElement).disabled).toBe(
      true,
    );
    expect((host.querySelector('[data-testid="save-draft"]') as HTMLButtonElement).disabled).toBe(
      true,
    );
  });

  it('debe bloquear el registro mientras está enviando', async () => {
    const fixture = await setup(undefined, true);
    const host = fixture.nativeElement as HTMLElement;
    const submit = host.querySelector('[data-testid="submit-order"]') as HTMLButtonElement;

    expect(submit.disabled).toBe(true);
    expect(submit.textContent).toContain('Registrando…');
  });

  it('debe mantener deshabilitada la cotización hasta su fase', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;

    expect((host.querySelector('[data-testid="quote-draft"]') as HTMLButtonElement).disabled).toBe(
      true,
    );
  });

  it('debe emitir cantidades, bajas, descuento, observaciones y acciones', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;
    const panel = fixture.componentInstance;
    const quantityChanges: OrderLineQuantityChange[] = [];
    const removed: string[] = [];
    const discounts: number[] = [];
    const observations: string[] = [];
    let submitted = 0;
    let saved = 0;
    panel.quantityChange.subscribe((value) => quantityChanges.push(value));
    panel.removeLine.subscribe((value) => removed.push(value));
    panel.discountChange.subscribe((value) => discounts.push(value));
    panel.observationsChange.subscribe((value) => observations.push(value));
    panel.registerOrder.subscribe(() => submitted++);
    panel.saveDraft.subscribe(() => saved++);

    const firstRow = host.querySelector('[data-testid="draft-line-vp-1"]') as HTMLElement;
    (firstRow.querySelector('[data-testid="stepper-plus"]') as HTMLButtonElement).click();
    (firstRow.querySelector('[data-testid="remove-line"]') as HTMLButtonElement).click();

    const discount = host.querySelector('[data-testid="discount-input"]') as HTMLInputElement;
    discount.value = '20';
    discount.dispatchEvent(new Event('input'));

    const textarea = host.querySelector(
      '[data-testid="observations-input"]',
    ) as HTMLTextAreaElement;
    textarea.value = 'Entregar por la tarde';
    textarea.dispatchEvent(new Event('input'));

    (host.querySelector('[data-testid="submit-order"]') as HTMLButtonElement).click();
    (host.querySelector('[data-testid="save-draft"]') as HTMLButtonElement).click();

    expect(quantityChanges).toEqual([{ productId: 'vp-1', quantity: 2 }]);
    expect(removed).toEqual(['vp-1']);
    expect(discounts).toEqual([20]);
    expect(observations).toEqual(['Entregar por la tarde']);
    expect(submitted).toBe(1);
    expect(saved).toBe(1);
  });
});
