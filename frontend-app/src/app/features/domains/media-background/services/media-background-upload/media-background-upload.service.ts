import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import {
  MediaBackgroundUploadResult,
  MediaBackgroundMediaType,
} from '@core/models/media-background.model';
import { STORAGE_REPOSITORY, storagePublicObjectUrl } from '../../../file-storage/public-api';
import type { MediaBackgroundUploadOptions } from './media-background-upload.types';

/**
 * Subida de binarios de fondo con el flujo común de storage: solicitud
 * prefirmada → PUT → confirmar → objeto público. El componente presentacional
 * recibe esta función como input; el puerto no se inyecta en la UI (`R-SO-8`).
 */
@Injectable()
export class MediaBackgroundUploadService {
  private readonly storage = inject(STORAGE_REPOSITORY);

  upload(
    file: File,
    options: MediaBackgroundUploadOptions,
  ): Observable<MediaBackgroundUploadResult> {
    return this.storage
      .requestUpload({
        name: file.name,
        contentType: file.type,
        sizeBytes: file.size,
        folder: options.folder,
        description: options.description,
        isPublic: true,
      })
      .pipe(
        switchMap((upload) =>
          this.storage
            .uploadToUrl(upload.uploadUrl, upload.headers, file)
            .pipe(map(() => upload.objectId)),
        ),
        switchMap((objectId) => this.storage.confirm(objectId)),
        map((object) => ({
          objectId: object.id,
          url: storagePublicObjectUrl(object.id),
          mediaType: (file.type.startsWith('video/')
            ? 'video'
            : 'imagen') as MediaBackgroundMediaType,
        })),
      );
  }
}
