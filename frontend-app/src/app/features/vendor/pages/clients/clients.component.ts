import { Component, OnDestroy, computed, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../../../core/services/seo.service';
import { SkeletonLoaderComponent } from '../../../../shared/ui/skeleton/skeleton-loader.component';
import { CreateClientModalComponent } from '../../components/create-client-modal/create-client-modal.component';
import { CreateClientPayload } from '../../models/vendor-order.model';
import { ClientSearchStore } from '../../state/client-search.store';

/**
 * Cartera de clientes del vendedor (`R-UX-1`, `R-UX-6`): búsqueda por nombre,
 * código o teléfono con `debounce` y alta rápida reutilizando el modal del POS
 * (`R-AR-7`). La página cablea el `ClientSearchStore` compartido y delega
 * toda la lógica en él.
 */
@Component({
  selector: 'app-vendor-clients',
  standalone: true,
  imports: [RouterLink, CreateClientModalComponent, SkeletonLoaderComponent],
  templateUrl: './clients.component.html',
})
export default class ClientsComponent implements OnDestroy {
  readonly clients = inject(ClientSearchStore);
  private readonly seoService = inject(SeoService);

  protected readonly isModalOpen = signal(false);
  protected readonly resultCount = computed(() => this.clients.results().length);
  protected readonly hasQuery = computed(() => this.clients.query().trim().length > 0);

  constructor() {
    this.seoService.setPage(
      'Clientes — Panel del vendedor',
      'Busca en tu cartera de clientes por nombre, código o teléfono y registra clientes nuevos.',
    );

    this.clients.loadInitial();

    // El cliente recién creado cierra el modal y limpia la marca del store.
    effect(() => {
      if (this.clients.lastCreated()) {
        this.clients.acknowledgeCreated();
        this.isModalOpen.set(false);
      }
    });
  }

  ngOnDestroy(): void {
    this.clients.reset();
    this.seoService.reset();
  }

  protected onQueryInput(event: Event): void {
    this.clients.setQuery((event.target as HTMLInputElement).value);
  }

  protected openModal(): void {
    this.isModalOpen.set(true);
  }

  protected closeModal(): void {
    this.isModalOpen.set(false);
  }

  protected submitClient(payload: CreateClientPayload): void {
    this.clients.createClient(payload);
  }

  protected initials(name: string): string {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  }
}
