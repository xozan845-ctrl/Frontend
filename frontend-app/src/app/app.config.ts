import {
  ApplicationConfig,
  inject,
  isDevMode,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideServiceWorker } from '@angular/service-worker';
import { routes } from './app.routes';
import { RuntimeConfigService } from './core/config/runtime-config.service';
import { authInterceptor } from './features/auth/interceptors/auth.interceptor';
import { aiScraperAuthInterceptor } from './features/ai-scraper/interceptors/ai-scraper-auth.interceptor';
import { PRODUCT_REPOSITORY } from './features/products/repositories/product.repository';
import { ProductService } from './features/products/services/product.service';
import { ORDER_REPOSITORY } from './features/cart/repositories/order.repository';
import { OrderService } from './features/cart/services/order.service';
import { AUTH_REPOSITORY } from './features/auth/repositories/auth.repository';
import { AuthService } from './features/auth/services/auth.service';
import { CART_REPOSITORY } from './features/cart/repositories/cart.repository';
import { CartService } from './features/cart/services/cart.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor, aiScraperAuthInterceptor])),
    // Configuración de despliegue en runtime (`/config.json`) antes de crear
    // los servicios que leen `environment` (R-AR-11, R-CD-4).
    provideAppInitializer(() => inject(RuntimeConfigService).load()),
    // Inversión de Dependencias (DIP - Clean Architecture):
    // El dominio y la capa de aplicación dependen de interfaces abstractas.
    // Aquí se conectan a sus implementaciones de infraestructura (HTTP/Mocks).
    { provide: PRODUCT_REPOSITORY, useClass: ProductService },
    { provide: ORDER_REPOSITORY, useClass: OrderService },
    { provide: AUTH_REPOSITORY, useClass: AuthService },
    { provide: CART_REPOSITORY, useClass: CartService },
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
