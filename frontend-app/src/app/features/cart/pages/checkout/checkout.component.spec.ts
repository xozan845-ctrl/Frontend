import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthStore } from '../../../auth/state/auth.store';
import { CartStore } from '../../state/cart.store';
import { ORDER_REPOSITORY } from '../../repositories/order.repository';
import { NotificationService } from '../../../../core/services/notification.service';
import { SeoService } from '../../../../core/services/seo.service';
import { Product } from '../../../products/models/product.model';
import { CheckoutComponent } from './checkout.component';

describe('CheckoutComponent', () => {
  const cartItems = signal<{ product: Product; quantity: number }[]>([]);
  const cartStore = {
    items: cartItems,
    totalPrice: () => 0,
    finalPrice: () => 0,
    discountAmount: () => 0,
    appliedCoupon: () => null,
    clearCart: vi.fn(),
  };
  const authStore = { user: () => ({ name: 'Ana', email: 'ana@tienda.com' }) };
  const notification = { showSuccess: vi.fn(), showError: vi.fn() };
  const seo = { setPage: vi.fn(), reset: vi.fn() };
  const orderRepo = { createOrder: vi.fn(() => of({ id: 1 })) };

  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [CheckoutComponent],
      providers: [
        provideRouter([]),
        { provide: CartStore, useValue: cartStore },
        { provide: AuthStore, useValue: authStore },
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
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
  });

  it('debe mostrar el formulario de envío en el primer paso', async () => {
    const fixture = await setup();

    expect(fixture.componentInstance.currentStep()).toBe(1);
    expect(fixture.nativeElement.querySelector('#shippingFullName')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('form')).not.toBeNull();
  });

  it('no debe avanzar al paso de pago con datos de envío inválidos', async () => {
    const fixture = await setup();
    const component = fixture.componentInstance;

    component.goToStep(2);

    expect(component.currentStep()).toBe(1);
    expect(component.shippingForm.controls.fullName.touched).toBe(true);
  });

  it('debe avanzar al pago cuando los datos de envío son válidos', async () => {
    const fixture = await setup();
    const component = fixture.componentInstance;
    component.shippingForm.setValue({
      fullName: 'Ana Pérez',
      email: 'ana@tienda.com',
      address: 'Calle Principal 123',
      city: 'Monterrey',
      zipCode: '64000',
      phone: '8112345678',
    });

    component.goToStep(2);

    expect(component.currentStep()).toBe(2);
  });

  it('no debe avanzar a revisión con datos de pago inválidos', async () => {
    const fixture = await setup();
    const component = fixture.componentInstance;
    component.goToStep(3);

    expect(component.currentStep()).toBe(1);
    expect(component.paymentForm.controls.cardName.touched).toBe(true);
  });

  it('debe calcular los puntos como el diez por ciento del total', async () => {
    cartStore.totalPrice = () => 123.45;
    const fixture = await setup();

    expect(fixture.componentInstance.calculatePoints()).toBe(12);
    cartStore.totalPrice = () => 0;
  });

  it('debe enviar la orden con las ofertas del carrito y navegar a confirmación', async () => {
    const fixture = await setup();
    const component = fixture.componentInstance;
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    cartItems.set([
      {
        product: {
          id: 'of-1',
          name: 'Teclado',
          description: 'SKU SKU-TEC',
          price: 1380,
          imageUrl: '',
          category: 'General',
          stock: 10,
        },
        quantity: 2,
      },
    ]);

    component.submitOrder();

    expect(orderRepo.createOrder).toHaveBeenCalledWith({
      items: [{ ofertaId: 'of-1', quantity: 2 }],
    });
    expect(cartStore.clearCart).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/checkout/confirmation']);
  });
});
