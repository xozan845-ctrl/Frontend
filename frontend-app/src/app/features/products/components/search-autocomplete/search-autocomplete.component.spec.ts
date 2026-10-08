import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { SearchAutocompleteComponent } from './search-autocomplete.component';
import { ProductStore } from '../../state/product.store';
import { Product } from '../../models/product.model';

const products: Product[] = [
  {
    id: 1,
    name: 'Teclado Mecánico',
    description: 'Teclas RGB',
    price: 100,
    imageUrl: '',
    category: 'Periféricos',
    stock: 5,
  },
  {
    id: 2,
    name: 'Mouse Gamer',
    description: 'Inalámbrico',
    price: 50,
    imageUrl: '',
    category: 'Periféricos',
    stock: 3,
  },
];

describe('SearchAutocompleteComponent', () => {
  let fixture: ComponentFixture<SearchAutocompleteComponent>;
  let router: Router;

  const type = (value: string) =>
    fixture.componentInstance.onInput({ target: { value } } as unknown as Event);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchAutocompleteComponent],
      providers: [
        provideRouter([]),
        {
          provide: ProductStore,
          useValue: { products: () => products, storeId: () => 'tienda-1' },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(SearchAutocompleteComponent);
    fixture.detectChanges();
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  it('debe crear el componente cerrado', () => {
    expect(fixture.componentInstance.isOpen()).toBe(false);
    expect(fixture.componentInstance.matchedProducts()).toEqual([]);
  });

  it('debe filtrar los productos al escribir', async () => {
    type('tec');

    await vi.waitFor(() => expect(fixture.componentInstance.matchedProducts()).toHaveLength(1));
    expect(fixture.componentInstance.matchedProducts()[0].id).toBe(1);
    expect(fixture.componentInstance.isOpen()).toBe(true);
  });

  it('no debe abrir resultados con menos de dos caracteres', async () => {
    type('t');

    await vi.waitFor(() => expect(fixture.componentInstance.searchTerm()).toBe('t'));
    expect(fixture.componentInstance.matchedProducts()).toEqual([]);
    expect(fixture.componentInstance.isOpen()).toBe(false);
  });

  it('debe trocear el nombre en fragmentos resaltados', async () => {
    type('tec');

    await vi.waitFor(() => expect(fixture.componentInstance.highlightedProducts()).toHaveLength(1));
    const parts = fixture.componentInstance.highlightedProducts()[0].parts;
    expect(parts.some((part) => part.matched && part.value.toLowerCase() === 'tec')).toBe(true);
  });

  it('debe navegar al producto enfocado con Enter', async () => {
    type('tec');
    await vi.waitFor(() => expect(fixture.componentInstance.isOpen()).toBe(true));

    fixture.componentInstance.focusedIndex.set(0);
    fixture.componentInstance.onKeydown(new KeyboardEvent('keydown', { key: 'Enter' }));

    expect(router.navigate).toHaveBeenCalledWith(['/tienda', 'tienda-1', 'producto', 1]);
  });

  it('debe cerrar los resultados con Escape', async () => {
    type('tec');
    await vi.waitFor(() => expect(fixture.componentInstance.isOpen()).toBe(true));

    fixture.componentInstance.onKeydown(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(fixture.componentInstance.isOpen()).toBe(false);
  });

  it('debe mover el índice enfocado con las flechas', async () => {
    type('tec');
    await vi.waitFor(() => expect(fixture.componentInstance.isOpen()).toBe(true));

    fixture.componentInstance.onKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));

    expect(fixture.componentInstance.focusedIndex()).toBe(0);
  });
});
