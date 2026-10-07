import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Product } from '../../models/product.model';
import { ProductCarouselComponent } from './product-carousel.component';

const products: Product[] = [
  {
    id: 1,
    name: 'Producto uno',
    description: 'Uno',
    price: 10,
    imageUrl: '/uno.jpg',
    category: 'Audio',
    stock: 1,
  },
  {
    id: 2,
    name: 'Producto dos',
    description: 'Dos',
    price: 20,
    imageUrl: '/dos.jpg',
    category: 'Video',
    stock: 1,
  },
];

describe('ProductCarouselComponent', () => {
  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [ProductCarouselComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(ProductCarouselComponent);
    fixture.componentRef.setInput('products', products);
    fixture.componentRef.setInput('itemsPerPage', 1);
    fixture.detectChanges();
    return fixture;
  };

  it('debe mostrar el primer producto y deshabilitar anterior', async () => {
    const fixture = await setup();
    const previous = fixture.nativeElement.querySelector('[aria-label="Anterior"]');

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Producto uno');
    expect(previous.disabled).toBe(true);
    expect(fixture.componentInstance.canGoNext()).toBe(true);
  });

  it('debe avanzar y retroceder por los productos', async () => {
    const fixture = await setup();
    fixture.nativeElement.querySelector('[aria-label="Siguiente"]').click();
    fixture.detectChanges();

    expect(fixture.componentInstance.currentIndex()).toBe(1);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Producto dos');

    fixture.nativeElement.querySelector('[aria-label="Anterior"]').click();
    fixture.detectChanges();

    expect(fixture.componentInstance.currentIndex()).toBe(0);
  });

  it('debe impedir avanzar más allá del último producto', async () => {
    const fixture = await setup();
    fixture.componentInstance.next();

    expect(fixture.componentInstance.currentIndex()).toBe(1);
    expect(fixture.componentInstance.canGoNext()).toBe(false);

    fixture.componentInstance.next();
    expect(fixture.componentInstance.currentIndex()).toBe(1);
  });
});
