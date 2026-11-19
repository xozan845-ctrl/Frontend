import { inject, InjectionToken } from '@angular/core';
import { HttpBackend, HttpClient } from '@angular/common/http';

/**
 * Cliente HTTP que no ejecuta la cadena global de interceptores. Se usa para
 * recursos públicos (`config.json`) y servicios independientes que no deben
 * recibir credenciales del API (`R-SE-8`).
 */
export const INTERCEPTOR_FREE_HTTP_CLIENT = new InjectionToken<HttpClient>(
  'INTERCEPTOR_FREE_HTTP_CLIENT',
  {
    providedIn: 'root',
    factory: () => new HttpClient(inject(HttpBackend)),
  },
);
