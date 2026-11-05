import { Component, inject } from '@angular/core';
import { tap } from 'rxjs/operators';
import { injectSeoPage } from '../../../../../core/services/seo/seo.service';
import { NotificationService } from '../../../../../core/services/notification/notification.service';
import { SkeletonLoaderComponent } from '../../../../../shared/ui/skeleton/skeleton-loader.component';
import {
  MEDIA_BACKGROUND_PROVIDERS,
  MediaBackgroundDraft,
  MediaBackgroundEditorComponent,
  MediaBackgroundStore,
  MediaBackgroundWriteService,
} from '../../../../domains/media-background/public-api';

/**
 * Personalización global de plataforma (ADR-38/ADR-40): fondo del sitio y
 * fondo del panel de IA. Solo accesible para admin/super_admin (`adminGuard`).
 */
@Component({
  selector: 'app-admin-branding',
  standalone: true,
  imports: [MediaBackgroundEditorComponent, SkeletonLoaderComponent],
  providers: [...MEDIA_BACKGROUND_PROVIDERS],
  templateUrl: './branding.component.html',
})
export default class AdminBrandingComponent {
  readonly store = inject(MediaBackgroundStore);
  private readonly writer = inject(MediaBackgroundWriteService);
  private readonly notifications = inject(NotificationService);

  private readonly seo = injectSeoPage(
    'Personalización — Administración',
    'Fondos de plataforma y del panel de IA.',
  );

  private readonly loadPlatform = this.store.loadPlatform();
  private readonly loadPanelAi = this.store.loadPanelAi();

  readonly guardarPlataforma = (draft: MediaBackgroundDraft) =>
    this.writer
      .updateSite('platform', draft)
      .pipe(tap((config) => this.store.setPlatform(config)));

  readonly guardarPanelAi = (draft: MediaBackgroundDraft) =>
    this.writer
      .updateSite('panel-ai', draft)
      .pipe(tap((config) => this.store.setPanelAi(config)));

  constructor() {
    this.seo.updateTitle('Personalización — Administración');
  }

  onGuardado(mensaje: string): void {
    this.notifications.showSuccess(mensaje);
  }
}
