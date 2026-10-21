import {
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { injectSeoPage } from '../../../../core/services/seo/seo.service';
import { ClientPickerComponent } from '../../components/client-picker/client-picker.component';
import { CreateClientModalComponent } from '../../components/create-client-modal/create-client-modal.component';
import { OrderDraftPanelComponent } from '../../components/order-draft-panel/order-draft-panel.component';
import { OrderInfoFieldsComponent } from '../../components/order-info-fields/order-info-fields.component';
import { ProductPickGridComponent } from '../../components/product-pick-grid/product-pick-grid.component';
import { RecentOrdersTableComponent } from '../../components/recent-orders-table/recent-orders-table.component';
import { Client, CreateClientPayload, OrderDraftInfo } from '../../models/vendor-order.model';
import { ClientSearchStore } from '../../state/client-search/client-search.store';
import { OrderDraftStore } from '../../state/order-draft/order-draft.store';
import { VendorCatalogStore } from '../../state/vendor-catalog/vendor-catalog.store';
import { VendorOrdersStore } from '../../state/vendor-orders/vendor-orders.store';

/**
 * Punto de venta "Nuevo pedido" (ADR-20): contenedor que conecta los stores
 * (borrador, catálogo, clientes y pedidos recientes) con los componentes
 * presentacionales (`R-SO-6`, `R-CX-3`). Registra el pedido, refresca los
 * recientes y deja seleccionado al cliente recién creado.
 */
@Component({
  selector: 'app-vendor-new-order',
  standalone: true,
  imports: [
    RouterLink,
    ClientPickerComponent,
    CreateClientModalComponent,
    OrderDraftPanelComponent,
    OrderInfoFieldsComponent,
    ProductPickGridComponent,
    RecentOrdersTableComponent,
  ],
  templateUrl: './new-order.component.html',
})
export default class NewOrderComponent {
  readonly draft = inject(OrderDraftStore);
  readonly catalog = inject(VendorCatalogStore);
  readonly clients = inject(ClientSearchStore);
  readonly orders = inject(VendorOrdersStore);
  private readonly seoService = injectSeoPage(
    'Nuevo pedido — Panel del vendedor',
    'Registra los pedidos de tus clientes desde el punto de venta: cliente, productos, totales y observaciones.',
  );
  private readonly recentOrdersSection = viewChild<ElementRef<HTMLElement>>('recentOrdersSection');

  readonly isClientModalOpen = signal(false);
  /** Los recientes del POS muestran solo los últimos movimientos. */
  readonly recentOrders = computed(() => this.orders.orders().slice(0, 5));

  private readonly loadCatalog = this.catalog.loadProducts();
  private readonly startPolling = this.orders.startPolling();
  private readonly loadClients = this.clients.loadInitial();

  // Tras registrar un pedido, refresca los recientes sin esperar al polling.
  private readonly refreshAfterCreate = effect(() => {
    if (this.draft.lastCreatedOrder()) {
      this.orders.refresh();
    }
  });

  // El cliente recién creado queda seleccionado y el modal se cierra.
  private readonly selectCreatedClient = effect(() => {
    const created = this.clients.lastCreated();
    if (created) {
      this.draft.selectClient(created);
      this.clients.acknowledgeCreated();
      this.isClientModalOpen.set(false);
    }
  });

  private readonly cleanup = inject(DestroyRef).onDestroy(() => this.orders.stopPolling());

  selectClient(client: Client): void {
    this.draft.selectClient(client);
  }

  clearClient(): void {
    this.draft.selectClient(null);
  }

  updateOrderInfo(partial: Partial<OrderDraftInfo>): void {
    this.draft.setOrderInfo(partial);
  }

  createClient(payload: CreateClientPayload): void {
    this.clients.createClient(payload);
  }

  submitOrder(): void {
    this.draft.submitOrder();
  }

  scrollToRecentOrders(): void {
    const target = this.recentOrdersSection()?.nativeElement;
    if (!target) return;
    const prefersReducedMotion =
      window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
    target.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'start',
    });
  }
}
