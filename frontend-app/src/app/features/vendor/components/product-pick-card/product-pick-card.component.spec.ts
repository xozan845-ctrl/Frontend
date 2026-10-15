import { TestBed } from '@angular/core/testing';
import { ProductPickCardComponent } from './product-pick-card.component';
import { VendorProduct } from '../../models/vendor-order.model';

const product: VendorProduct = {
  id: 'vp-1',
  name: 'Shampoo Keratina',
  sku: 'KPBM-001',
  category: 'Cuidado capilar',
  price: 180,
  imageUrl: '',
  inStock: true,
};

describe('ProductPickCardComponent', () => {
  const setup = async (value: VendorProduct = product) => {
    await TestBed.configureTestingModule({
      imports: [ProductPickCardComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(ProductPickCardComponent);
    fixture.componentRef.setInput('product', value);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe renderizar nombre, código, precio y stock', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;
    const card = host.querySelector('[data-testid="product-card-vp-1"]') as HTMLElement;

    expect(card.textContent).toContain('Shampoo Keratina');
    expect(card.textContent).toContain('KPBM-001');
    expect(card.textContent).toContain('C$180.00');
    expect(host.querySelector('[data-testid="stock-chip"]')?.textContent).toContain('En stock');
    expect((host.querySelector('[data-testid="add-product"]') as HTMLButtonElement).disabled).toBe(
      false,
    );
  });

  it('debe emitir el producto al agregar', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;
    const added: VendorProduct[] = [];
    fixture.componentInstance.add.subscribe((value) => added.push(value));

    (host.querySelector('[data-testid="add-product"]') as HTMLButtonElement).click();

    expect(added).toEqual([product]);
  });

  it('debe mostrar Agotado y bloquear el agregado sin existencias', async () => {
    const fixture = await setup({ ...product, inStock: false });
    const host = fixture.nativeElement as HTMLElement;
    const added: VendorProduct[] = [];
    fixture.componentInstance.add.subscribe((value) => added.push(value));

    expect(host.querySelector('[data-testid="stock-chip"]')?.textContent).toContain('Agotado');
    const button = host.querySelector('[data-testid="add-product"]') as HTMLButtonElement;
    expect(button.disabled).toBe(true);

    button.click();
    expect(added).toEqual([]);
  });
});
