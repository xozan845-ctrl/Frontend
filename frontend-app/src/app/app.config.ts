import { ApplicationConfig, isDevMode, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideServiceWorker } from '@angular/service-worker';
import { routes } from './app.routes';
import { authInterceptor } from './domains/auth/interceptors/auth.interceptor';
import { PRODUCT_REPOSITORY } from './domains/products/repositories/product.repository';
import { ProductService } from './domains/products/services/product.service';
import { ORDER_REPOSITORY } from './domains/cart/repositories/order.repository';
import { OrderService } from './domains/cart/services/order.service';
import { AUTH_REPOSITORY } from './domains/auth/repositories/auth.repository';
import { AuthService } from './domains/auth/services/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    // Inversión de Dependencias (DIP - Clean Architecture):
    // El dominio y la capa de aplicación dependen de interfaces abstractas.
    // Aquí se conectan a sus implementaciones de infraestructura (HTTP/Mocks).
    { provide: PRODUCT_REPOSITORY, useClass: ProductService },
    { provide: ORDER_REPOSITORY, useClass: OrderService },
    { provide: AUTH_REPOSITORY, useClass: AuthService },
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
