import { Component, computed, input, output } from '@angular/core';
import { VENDOR_TAX_RATE, type OrderDraftLine } from '../../../../vendor/public-api';
import { OrderLineComponent } from '../order-line/order-line.component';
import { OrderTotalsComponent } from '../../../../../shared/orders/components/order-totals/order-totals.component';
import type { OrderLineQuantityChange } from './order-draft-panel.types';

/**
 * Panel "Pedido actual" del POS (presentacional, `R-SO-8`): líneas con
 * steppers, totales, observaciones y acciones (Registrar, Guardar borrador y
 * Generar cotización — esta última visible pero deshabilitada hasta su fase).
 * No conoce stores: emite intenciones que resuelve la página.
 */
@Component({
  selector: 'app-order-draft-panel',
  standalone: true,
  imports: [OrderLineComponent, OrderTotalsComponent],
  templateUrl: './order-draft-panel.component.html',
})
export class OrderDraftPanelComponent {
  readonly lines = input.required<OrderDraftLine[]>();
  readonly subtotal = input.required<number>();
  readonly discountPercent = input.required<number>();
  readonly discountAmount = input.required<number>();
  readonly taxAmount = input.required<number>();
  readonly total = input.required<number>();
  readonly observations = input.required<string>();
  readonly submitting = input(false);
  readonly quantityChange = output<OrderLineQuantityChange>();
  readonly removeLine = output<string>();
  readonly discountChange = output<number>();
  readonly observationsChange = output<string>();
  readonly registerOrder = output<void>();
  readonly saveDraft = output<void>();

  protected readonly isEmpty = computed(() => this.lines().length === 0);
  protected readonly taxLabel = `IVA (${Math.round(VENDOR_TAX_RATE * 100)} %)`;
  protected readonly submitDisabled = computed(() => this.isEmpty() || this.submitting());
  protected readonly countLabel = computed(() => {
    const count = this.lines().length;
    return `${count} ${count === 1 ? 'producto' : 'productos'}`;
  });

  onObservationsInput(event: Event): void {
    this.observationsChange.emit((event.target as HTMLTextAreaElement).value);
  }
}
