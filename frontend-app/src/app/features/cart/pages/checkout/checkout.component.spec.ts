import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthStore } from '../../../auth/state/auth.store';
import { CartStore } from '../../state/cart.store';
import { ProductStore } from '../../../products/state/product.store';
import { ORDER_REPOSITORY } from '../../repositories/order.repository';
import { NotificationService } from '../../../../core/services/notification.service';
import { SeoService } from '../../../../core/services/seo.service';
import { Product } from '../../../products/models/product.model';
import { CheckoutComponent } from './checkout.component';

const product: Product = {
  id: 'of-1',
  name: 'Teclado',
  description: 'SKU SKU-TEC',
  price: 1380,
  imageUrl: '/teclado.jpg',
  category: 'General',
  stock: 10,
};

describe('CheckoutComponent', () => {
  const cartItems = signal<{ product: Product; quantity: number }[]>([]);
  const cartStore = {
    items: cartItems,
    totalPrice: () => 2760,
    reset: vi.fn(),
  };
  const authStore = { user: () => ({ name: 'Ana', email: 'ana@tienda.com' }) };
  const notification = { showSuccess: vi.fn(), showError: vi.fn() };
  const seo = { setPage: vi.fn(), reset: vi.fn() };
  const orderRepo = { createOrder: vi.fn(() => of({ id: 'o-1' })) };

  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [CheckoutComponent],
      providers: [
        provideRouter([]),
        { provide: CartStore, useValue: cartStore },
        { provide: AuthStore, useValue: authStore },
        { provide: ProductStore, useValue: { storeId: () => 'tienda-1' } },
        { provide: ORDER_REPOSITORY, useValue: orderRepo },
        { provide: NotificationService, useValue: notification },
        { provide: SeoService, useValue: seo },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(CheckoutComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    cartItems.set([]);
  });

  it('debe mostrar el estado vacío sin productos', async () => {
    const fixture = await setup();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Carrito vacío');
  });

  it('debe listar los productos y el total', async () => {
    cartItems.set([{ product, quantity: 2 }]);
    const fixture = await setup();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Teclado');
    expect(text).toContain('C$2,760.00');
  });

  it('no debe enviar la orden con el carrito vacío', async () => {
    const fixture = await setup();

    fixture.componentInstance.submitOrder();

    expect(orderRepo.createOrder).not.toHaveBeenCalled();
  });

  it('debe enviar la orden con las ofertas y navegar a confirmación', async () => {
    cartItems.set([{ product, quantity: 2 }]);
    const fixture = await setup();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    fixture.componentInstance.submitOrder();

    expect(orderRepo.createOrder).toHaveBeenCalledWith({ usarCarrito: true });
    expect(cartStore.reset).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/tienda', 'tienda-1', 'checkout', 'confirmacion']);
  });
});
