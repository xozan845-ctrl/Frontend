import { Component, OnDestroy, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AiConnectionStore } from '../../state/ai-connection.store';
import { SeoService } from '../../../../core/services/seo.service';
import { AiConnectionPanelComponent } from '../../components/ai-connection-panel/ai-connection-panel.component';

/**
 * Conexión con el backend de IA (`R-AR-1`, contenedor `R-SO-8`). El dashboard
 * es mínimo: solo configura endpoint y API key; el alta de jobs y su
 * supervisión viven en el chat de sesiones.
 */
@Component({
  selector: 'app-ai-dashboard',
  imports: [RouterLink, AiConnectionPanelComponent],
  templateUrl: './ai-dashboard.component.html',
})
export default class AiDashboardComponent implements OnDestroy {
  private readonly connection = inject(AiConnectionStore);
  private readonly seo = inject(SeoService);

  readonly endpoint = this.connection.endpoint;
  readonly hasKey = this.connection.hasKey;

  constructor() {
    this.seo.setPage('Scraping con IA', 'Configura la conexión con el backend de IA.');
  }

  ngOnDestroy(): void {
    this.seo.reset();
  }

  saveKey(value: string): void {
    this.connection.setApiKey(value);
  }

  clearKey(): void {
    this.connection.clearApiKey();
  }
}
