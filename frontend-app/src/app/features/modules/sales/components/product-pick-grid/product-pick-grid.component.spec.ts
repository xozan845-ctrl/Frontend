import { TestBed } from '@angular/core/testing';
import { ProductPickGridComponent } from './product-pick-grid.component';
import type { VendorProduct } from '../../../../vendor/public-api';

const product = (id: string, name: string): VendorProduct => ({
  id,
  name,
  sku: `SKU-${id}`,
  category: 'Cuidado capilar',
  price: 180,
  imageUrl: '',
  inStock: true,
});

interface SetupOptions {
  products?: VendorProduct[];
  loading?: boolean;
  error?: string | null;
  query?: string;
  category?: string | null;
}

describe('ProductPickGridComponent', () => {
  const setup = async (options: SetupOptions = {}) => {
    await TestBed.configureTestingModule({
      imports: [ProductPickGridComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(ProductPickGridComponent);
    fixture.componentRef.setInput(
      'products',
      options.products ?? [product('vp-1', 'Shampoo Keratina'), product('vp-2', 'Mascarilla')],
    );
    fixture.componentRef.setInput('categories', ['Cuidado capilar', 'Tratamientos']);
    fixture.componentRef.setInput('query', options.query ?? '');
    fixture.componentRef.setInput('category', options.category ?? null);
    fixture.componentRef.setInput('loading', options.loading ?? false);
    fixture.componentRef.setInput('error', options.error ?? null);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe renderizar las tarjetas y el conteo', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelectorAll('[data-testid^="product-card-"]')).toHaveLength(2);
    expect(host.querySelector('[data-testid="products-count"]')?.textContent).toContain(
      '2 productos',
    );
  });

  it('debe emitir el término digitado en el buscador', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;
    const queries: string[] = [];
    fixture.componentInstance.queryChange.subscribe((value) => queries.push(value));

    const input = host.querySelector('[data-testid="product-search"]') as HTMLInputElement;
    input.value = 'sham';
    input.dispatchEvent(new Event('input'));

    expect(queries).toEqual(['sham']);
  });

  it('debe emitir la categoría elegida y "Todas" como null', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;
    const categories: Array<string | null> = [];
    fixture.componentInstance.categoryChange.subscribe((value) => categories.push(value));

    (host.querySelector('[data-testid="category-Tratamientos"]') as HTMLButtonElement).click();
    (host.querySelector('[data-testid="category-all"]') as HTMLButtonElement).click();

    expect(categories).toEqual(['Tratamientos', null]);
  });

  it('debe mostrar skeletons mientras carga', async () => {
    const fixture = await setup({ loading: true });
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('[data-testid="product-grid"]')).toBeNull();
    expect(host.querySelectorAll('app-skeleton-loader').length).toBeGreaterThan(0);
    expect(host.textContent).toContain('Cargando catálogo…');
  });

  it('debe mostrar el error con acción de reintento', async () => {
    const fixture = await setup({ error: 'sin conexión' });
    const host = fixture.nativeElement as HTMLElement;
    let retries = 0;
    fixture.componentInstance.retry.subscribe(() => retries++);

    expect(host.textContent).toContain('No pudimos cargar tu catálogo');
    expect(host.textContent).toContain('sin conexión');

    (host.querySelector('app-empty-state button') as HTMLButtonElement).click();
    expect(retries).toBe(1);
  });

  it('debe distinguir el vacío real de la búsqueda sin coincidencias', async () => {
    const fixture = await setup({ products: [] });
    const host = fixture.nativeElement as HTMLElement;

    expect(host.textContent).toContain('Aún no tienes productos');

    fixture.componentRef.setInput('query', 'shampoo');
    fixture.detectChanges();

    expect(host.textContent).toContain('Sin coincidencias');
  });
});
