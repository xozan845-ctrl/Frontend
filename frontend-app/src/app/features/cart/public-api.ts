/** API de aplicación pública de `cart` para dominios consumidores. */
export type { CartItem } from './models/cart.model';
export type { OrderResponse, OrderItem, OrderTimelineEvent } from './models/order.model';
export { CartStore } from './state/cart/cart.store';
export { CartUiStore } from './state/cart-ui/cart-ui.store';
export { OrderStore } from './state/order/order.store';
export { ORDER_REPOSITORY, type OrderRepository } from './repositories/order.repository';
export { CART_REPOSITORY, type CartRepository } from './repositories/cart.repository';
export { orderStatusLabel } from './models/order.model';
export { OrderService } from './services/order/order.service';
export type { OrderStatusUpdate } from './models/order.model';
export {
  adaptOrderListFromBackend,
  adaptOrderResponse,
  adaptOrderTimelineFromBackend,
} from './adapters/order/order.adapter';
