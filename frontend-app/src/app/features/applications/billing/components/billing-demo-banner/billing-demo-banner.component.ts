import { Component } from '@angular/core';

/**
 * Aviso de demostración de facturación (`R-DO-3`, `R-UX-1`): etiqueta con
 * precisión que el módulo es una demo y que no ejecuta acciones de negocio.
 * Es presentacional: no inyecta servicios ni conoce stores (`R-SO-8`).
 */
@Component({
  selector: 'app-billing-demo-banner',
  standalone: true,
  templateUrl: './billing-demo-banner.component.html',
})
export class BillingDemoBannerComponent {}
