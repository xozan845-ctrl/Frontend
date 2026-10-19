import { TestBed } from '@angular/core/testing';
import { BILLING_PRODUCTS } from '../../adapters/fixtures/billing.fixture';
import { CatalogPickerCardComponent } from './catalog-picker-card.component';

const categories = ['Cremas', 'Cuidado capilar', 'Tintes', 'Tratamientos'];

describe('CatalogPickerCardComponent', () => {
  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [CatalogPickerCardComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(CatalogPickerCardComponent);
    fixture.componentRef.setInput('products', [...BILLING_PRODUCTS]);
    fixture.componentRef.setInput('categories', categories);
    fixture.componentRef.setInput('query', '');
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe pintar productos, chips de categoría y stock', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelectorAll('[data-testid^="billing-product-card-"]').length).toBe(8);
    expect(host.querySelector('[data-testid="billing-products-count"]')?.textContent).toContain(
      '8 productos',
    );
    expect(host.querySelectorAll('[data-testid="billing-category-all"]').length).toBe(1);
    expect(host.textContent).toContain('Agotado');
  });

  it('debe emitir búsqueda, categoría y producto agregado', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;
    const queries: string[] = [];
    const selectedCategories: Array<string | null> = [];
    const added: string[] = [];
    fixture.componentInstance.queryChange.subscribe((value) => queries.push(value));
    fixture.componentInstance.categoryChange.subscribe((value) => selectedCategories.push(value));
    fixture.componentInstance.add.subscribe((product) => added.push(product.id));

    const input = host.querySelector('[data-testid="billing-product-search"]') as HTMLInputElement;
    input.value = 'crema';
    input.dispatchEvent(new Event('input'));
    (host.querySelector('[data-testid="billing-category-Cremas"]') as HTMLButtonElement).click();
    (
      host.querySelector(
        '[data-testid="billing-product-card-prod-1"] [data-testid="billing-add-product"]',
      ) as HTMLButtonElement
    ).click();

    expect(queries).toEqual(['crema']);
    expect(selectedCategories).toEqual(['Cremas']);
    expect(added).toEqual(['prod-1']);
  });

  it('debe deshabilitar los productos agotados', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;
    const button = host.querySelector(
      '[data-testid="billing-product-card-prod-7"] [data-testid="billing-add-product"]',
    ) as HTMLButtonElement;

    expect(button.disabled).toBe(true);
  });
});
