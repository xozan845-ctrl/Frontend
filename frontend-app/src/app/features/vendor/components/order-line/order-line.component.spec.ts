import { TestBed } from '@angular/core/testing';
import { OrderLineComponent } from './order-line.component';
import { OrderDraftLine } from '../../models/vendor-order.model';

const line: OrderDraftLine = {
  product: {
    id: 'vp-1',
    name: 'Shampoo Keratina',
    sku: 'KPBM-001',
    category: 'Cuidado capilar',
    price: 180,
    imageUrl: '',
    inStock: true,
  },
  quantity: 2,
};

describe('OrderLineComponent', () => {
  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [OrderLineComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(OrderLineComponent);
    fixture.componentRef.setInput('line', line);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe renderizar producto, precio unitario y total de línea', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;
    const row = host.querySelector('[data-testid="draft-line-vp-1"]') as HTMLElement;

    expect(row.textContent).toContain('Shampoo Keratina');
    expect(row.textContent).toContain('KPBM-001');
    expect(row.textContent).toContain('C$180.00');
    expect(host.querySelector('[data-testid="line-total"]')?.textContent).toContain('C$360.00');
  });

  it('debe emitir la cantidad nueva y la baja de la línea', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;
    const quantities: number[] = [];
    let removed = 0;
    fixture.componentInstance.quantityChange.subscribe((value) => quantities.push(value));
    fixture.componentInstance.remove.subscribe(() => removed++);

    (host.querySelector('[data-testid="stepper-plus"]') as HTMLButtonElement).click();
    (host.querySelector('[data-testid="remove-line"]') as HTMLButtonElement).click();

    expect(quantities).toEqual([3]);
    expect(removed).toBe(1);
  });

  it('debe mostrar "Sin código" cuando el producto no trae SKU', async () => {
    const fixture = await setup();
    fixture.componentRef.setInput('line', { ...line, product: { ...line.product, sku: '' } });
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Sin código');
  });
});
