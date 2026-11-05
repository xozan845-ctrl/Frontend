import { Component, computed, effect, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { throwError } from 'rxjs';
import { tap } from 'rxjs/operators';
import { injectSeoPage } from '../../../../../core/services/seo/seo.service';
import { SkeletonLoaderComponent } from '../../../../../shared/ui/skeleton/skeleton-loader.component';
import { ImageDropzoneComponent } from '../../../../../shared/ui/image-dropzone/image-dropzone.component';
import { MediaBackgroundEditorComponent } from '../../../../../shared/ui/media-background-editor/media-background-editor.component';
import { resolveStorageAssetUrl, storagePublicObjectUrl } from '../../../storage/public-api';
import {
  MediaBackgroundDraft,
  MediaBackgroundUploadService,
  MediaBackgroundWriteService,
} from '../../../../domains/media-background/public-api';
import { VendorStoreStore } from '../../state/vendor-store/vendor-store.store';
import { StoreLogoStore } from '../../state/store-logo/store-logo.store';

/**
 * Ficha de la tienda del vendedor (`GET /vendedores/me/tienda`, ADR-31):
 * identidad, empresa, participación y accesos a la tienda pública y al panel.
 */
@Component({
  selector: 'app-vendor-store',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    SkeletonLoaderComponent,
    ImageDropzoneComponent,
    MediaBackgroundEditorComponent,
  ],
  templateUrl: './store.component.html',
})
export default class VendorStoreComponent {
  readonly vendorStore = inject(VendorStoreStore);
  readonly storeLogo = inject(StoreLogoStore);
  private readonly mediaWriter = inject(MediaBackgroundWriteService);
  private readonly mediaUploads = inject(MediaBackgroundUploadService);
  private readonly seoService = injectSeoPage(
    'Mi tienda — Panel del vendedor',
    'Consulta la ficha de tu tienda, su empresa, participación y enlace público.',
  );

  /** Refleja el nombre de la tienda en la pestaña. */
  private readonly syncTitle = effect(() => {
    const store = this.vendorStore.store();
    if (store) {
      this.seoService.updateTitle(`${store.name} — Mi tienda`);
    }
  });

  /** Logo de la tienda (derivado o fallback público de storage). */
  readonly logoUrl = computed(() => {
    const store = this.vendorStore.store();
    if (!store) return null;
    return (
      resolveStorageAssetUrl(store.logoUrl) ??
      resolveStorageAssetUrl(store.companyLogoUrl) ??
      (store.logoObjectId ? storagePublicObjectUrl(store.logoObjectId) : null)
    );
  });

  readonly subirFondoTienda = (file: File) =>
    this.mediaUploads.upload(file, { folder: 'tiendas', description: 'Fondo de tienda' });

  /** Guarda el fondo de la tienda; la página está bajo `vendorGuard`. */
  readonly guardarFondoTienda = (draft: MediaBackgroundDraft) => {
    const store = this.vendorStore.store();
    if (!store) return throwError(() => new Error('Tienda no disponible.'));
    return this.mediaWriter
      .updateStore(store.id, draft)
      .pipe(tap((background) => this.vendorStore.applyStoreUpdate({ ...store, background })));
  };
}
