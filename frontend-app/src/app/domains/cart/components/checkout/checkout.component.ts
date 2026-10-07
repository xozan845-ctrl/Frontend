import { Component, DestroyRef, inject, signal, OnDestroy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgOptimizedImage, NgClass } from '@angular/common';
import { CartStore } from '../../state/cart.store';
import { AuthStore } from '../../../auth/state/auth.store';
import { NotificationService } from '../../../../shared/ui/notification/notification.service';
import { TrustBadgesComponent } from '../../../../shared/ui/trust-badges/trust-badges.component';
import { SeoService } from '../../../../shared/services/seo.service';
import { OrderService } from '../../services/order.service';
import { ORDER_REPOSITORY, OrderRepository } from '../../repositories/order.repository';
import { CreateOrderPayload } from '../../models/order.model';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [ReactiveFormsModule, NgOptimizedImage, NgClass, TrustBadgesComponent],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css',
})
export class CheckoutComponent implements OnDestroy {
  readonly cartStore = inject(CartStore);
  readonly authStore = inject(AuthStore);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private notificationService = inject(NotificationService);
  private readonly seoService = inject(SeoService);
  private orderService: OrderRepository =
    inject(ORDER_REPOSITORY, { optional: true }) ?? inject(OrderService);

  constructor() {
    this.seoService.setPage('Checkout', 'Finaliza tu compra en Quantum Store.');
  }

  ngOnDestroy(): void {
    this.seoService.reset();
  }

  currentStep = signal(1);
  isSubmitting = signal(false);

  shippingForm = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    address: ['', [Validators.required, Validators.minLength(5)]],
    city: ['', Validators.required],
    zipCode: ['', [Validators.required, Validators.pattern('^[0-9]{5}$')]],
    phone: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
  });

  paymentForm = this.fb.nonNullable.group({
    cardName: ['', Validators.required],
    cardNumber: ['', [Validators.required, Validators.pattern('^[0-9]{16}$')]],
    expiry: ['', [Validators.required, Validators.pattern('^(0[1-9]|1[0-2])/([0-9]{2})$')]],
    cvv: ['', [Validators.required, Validators.pattern('^[0-9]{3,4}$')]],
  });

  calculatePoints() {
    return Math.floor(this.cartStore.totalPrice() * 0.1);
  }

  goToStep(step: number) {
    if (step === 2 && this.shippingForm.invalid) {
      this.shippingForm.markAllAsTouched();
      return;
    }
    if (step === 3 && this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      return;
    }
    this.currentStep.set(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  submitOrder() {
    if (this.isSubmitting()) return;
    this.isSubmitting.set(true);
    this.notificationService.showSuccess('Procesando pago...');

    const pForm = this.paymentForm.getRawValue();
    const rawCard = pForm.cardNumber.replace(/\s+/g, '');
    const last4 = rawCard.slice(-4) || '0000';

    const payload: CreateOrderPayload = {
      items: this.cartStore.items().map((item) => ({
        productId: item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
      })),
      shipping: this.shippingForm.getRawValue(),
      payment: {
        cardName: pForm.cardName,
        cardNumber: `****-****-****-${last4}`,
        expiry: pForm.expiry,
        last4,
      },
      total: this.cartStore.finalPrice(),
      discountAmount: this.cartStore.discountAmount(),
      couponCode: this.cartStore.appliedCoupon(),
    };

    this.orderService
      .createOrder(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.cartStore.clearCart();
          this.isSubmitting.set(false);
          this.router.navigate(['/checkout/confirmation']);
        },
        error: (err) => {
          this.isSubmitting.set(false);
          const msg = err.message || 'Error al procesar la orden. Intenta nuevamente.';
          this.notificationService.showError(msg);
        },
      });
  }
}
export default CheckoutComponent;
