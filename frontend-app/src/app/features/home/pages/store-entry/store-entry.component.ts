import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

/**
 * Entrada raíz de la plataforma **multi-tienda**: no hay una tienda "por
 * defecto" (Core Engine es multi-tenant y no expone un directorio público).
 * Cada tienda se accede por su URL `/tienda/:storeId`; aquí se permite pegarla
 * o llegar con `?tienda=<id>`.
 */
@Component({
  selector: 'app-store-entry',
  standalone: true,
  templateUrl: './store-entry.component.html',
})
export default class StoreEntryComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly storeId = signal('');

  constructor() {
    const queryStore = this.route.snapshot.queryParamMap.get('tienda');
    if (queryStore) this.goToStore(queryStore);
  }

  onInput(event: Event): void {
    this.storeId.set((event.target as HTMLInputElement).value.trim());
  }

  goToStore(id: string = this.storeId()): void {
    if (!id) return;
    this.router.navigate(['/tienda', id, 'shop']);
  }

  /** Abre el asistente para crear una tienda (requiere cuenta de vendedor). */
  goToCreateStore(): void {
    this.router.navigate(['/crear-tienda']);
  }
}
