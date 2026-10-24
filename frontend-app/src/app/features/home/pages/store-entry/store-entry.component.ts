import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthStore } from '../../../auth/public-api';
import { injectSeoPage } from '../../../../core/services/seo/seo.service';

/** Un `storeId` válido: alfanumérico con guiones (UUID/slug), 1–100 caracteres. */
const STORE_ID_PATTERN = /^[A-Za-z0-9_-]{1,100}$/;

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
  private readonly authStore = inject(AuthStore);
  private readonly seoService = injectSeoPage(
    'Tu tienda',
    'Plataforma multi-tienda: encuentra tu tienda o crea la tuya en minutos.',
  );

  readonly storeId = signal('');
  readonly hasActiveCompany = this.authStore.hasActiveCompany;

  private readonly init = this.openFromQuery();

  onInput(event: Event): void {
    this.storeId.set((event.target as HTMLInputElement).value.trim());
  }

  private openFromQuery(): void {
    const queryStore = this.route.snapshot.queryParamMap.get('tienda');
    if (queryStore) this.goToStore(queryStore);
  }

  /** Navega a la tienda; valida y normaliza el id (query param/entrada, `R-SE-6`). */
  goToStore(id: string = this.storeId()): void {
    const storeId = id.trim();
    if (!STORE_ID_PATTERN.test(storeId)) return;
    this.router.navigate(['/tienda', storeId, 'shop']);
  }

  /** Abre el asistente para crear una empresa y su primera tienda. */
  goToCreateStore(): void {
    this.router.navigate(['/crear-empresa']);
  }

  /** Abre el workspace del empresario que ya tiene una empresa activa. */
  goToCompanyWorkspace(): void {
    this.router.navigate(['/empresa/inicio']);
  }
}
