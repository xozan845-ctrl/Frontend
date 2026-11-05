import { Component, effect, inject, input, output, signal } from '@angular/core';
import { EMPTY, Observable } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import {
  MediaBackgroundConfig,
  MediaBackgroundDraft,
  MediaBackgroundPosition,
  clampMediaBackgroundOverlay,
  mediaBackgroundDraftFromConfig,
} from '../../../../../core/models/media-background.model';
import { ImageDropzoneComponent } from '../../../../../shared/ui/image-dropzone/image-dropzone.component';
import {
  STORAGE_REPOSITORY,
  storagePublicObjectUrl,
} from '../../../../applications/storage/public-api';

const POSICIONES: readonly MediaBackgroundPosition[] = [
  'center',
  'top',
  'bottom',
  'left',
  'right',
];

/**
 * Editor reutilizable de un fondo multimedia (imagen o video) con poster
 * opcional. No conoce el endpoint final: el consumidor entrega `save`, que
 * recibe el borrador y devuelve la configuración normalizada por el backend.
 *
 * El binario se sube con el mismo flujo de storage que usan los logos:
 * solicitud prefirmada → PUT → confirmar → asociar por id.
 */
@Component({
  selector: 'app-media-background-editor',
  standalone: true,
  imports: [ImageDropzoneComponent],
  templateUrl: './media-background-editor.component.html',
})
export class MediaBackgroundEditorComponent {
  readonly config = input<MediaBackgroundConfig | null>(null);
  readonly title = input('Fondo');
  readonly hint = input('Arrastra una imagen o un video, o haz clic para seleccionarlo.');
  readonly canEdit = input(true);
  readonly folder = input('fondos');
  readonly description = input('Fondo multimedia');
  readonly maxBytes = input(100 * 1024 * 1024);
  readonly posterMaxBytes = input(5 * 1024 * 1024);
  readonly save = input.required<
    (draft: MediaBackgroundDraft) => Observable<MediaBackgroundConfig>
  >();
  readonly saved = output<MediaBackgroundConfig>();

  private readonly storage = inject(STORAGE_REPOSITORY);
  readonly posiciones = POSICIONES;
  private lastConfig: MediaBackgroundConfig | null = null;

  readonly objectId = signal<string | null>(null);
  readonly posterObjectId = signal<string | null>(null);
  readonly previewUrl = signal<string | null>(null);
  readonly previewType = signal<'imagen' | 'video' | null>(null);
  readonly posterUrl = signal<string | null>(null);
  readonly alt = signal('');
  readonly overlay = signal(35);
  readonly position = signal<MediaBackgroundPosition>('center');
  readonly active = signal(false);
  readonly uploading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  private readonly sync = effect(() => {
    const config = this.config();
    if (config === this.lastConfig) return;
    this.lastConfig = config;
    this.aplicarConfig(config);
  });

  onBackgroundSelected(file: File): void {
    this.subir(file, 'fondo');
  }

  onPosterSelected(file: File): void {
    this.subir(file, 'poster');
  }

  onAltInput(event: Event): void {
    this.alt.set((event.target as HTMLInputElement).value.slice(0, 160));
  }

  onOverlayInput(event: Event): void {
    this.overlay.set(clampMediaBackgroundOverlay(Number((event.target as HTMLInputElement).value)));
  }

  onPositionChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as MediaBackgroundPosition;
    if (this.posiciones.includes(value)) this.position.set(value);
  }

  onActiveChange(event: Event): void {
    this.active.set((event.target as HTMLInputElement).checked);
  }

  quitarPoster(): void {
    this.posterObjectId.set(null);
    this.posterUrl.set(null);
  }

  quitar(): void {
    if (!this.canEdit() || this.saving()) return;
    this.objectId.set(null);
    this.posterObjectId.set(null);
    this.previewUrl.set(null);
    this.previewType.set(null);
    this.posterUrl.set(null);
    this.active.set(false);
    this.guardar();
  }

  guardar(): void {
    if (!this.canEdit() || this.saving() || this.uploading()) return;
    const draft: MediaBackgroundDraft = {
      objectId: this.objectId(),
      posterObjectId: this.posterObjectId(),
      alt: this.alt().trim(),
      overlay: clampMediaBackgroundOverlay(this.overlay()),
      position: this.position(),
      active: this.active(),
    };

    this.saving.set(true);
    this.error.set(null);
    this.save()(draft)
      .pipe(
        tap((config) => {
          this.lastConfig = config;
          this.aplicarConfig(config);
          this.saving.set(false);
          this.saved.emit(config);
        }),
        catchError((err: Error) => {
          this.error.set(err.message || 'No se pudo guardar el fondo.');
          this.saving.set(false);
          return EMPTY;
        }),
      )
      .subscribe();
  }

  private subir(file: File, tipo: 'fondo' | 'poster'): void {
    if (!this.canEdit()) return;
    this.uploading.set(true);
    this.error.set(null);

    this.storage
      .requestUpload({
        name: file.name,
        contentType: file.type,
        sizeBytes: file.size,
        folder: this.folder(),
        description: this.description(),
        isPublic: true,
      })
      .pipe(
        switchMap((upload) =>
          this.storage
            .uploadToUrl(upload.uploadUrl, upload.headers, file)
            .pipe(map(() => upload.objectId)),
        ),
        switchMap((objectId) => this.storage.confirm(objectId)),
        tap((object) => {
          const url = storagePublicObjectUrl(object.id);
          if (tipo === 'fondo') {
            this.objectId.set(object.id);
            this.previewUrl.set(url);
            this.previewType.set(file.type.startsWith('video/') ? 'video' : 'imagen');
            if (file.type.startsWith('video/')) this.active.set(true);
          } else {
            this.posterObjectId.set(object.id);
            this.posterUrl.set(url);
          }
          this.uploading.set(false);
        }),
        catchError((err: Error) => {
          this.error.set(err.message || 'No se pudo subir el archivo.');
          this.uploading.set(false);
          return EMPTY;
        }),
      )
      .subscribe();
  }

  private aplicarConfig(config: MediaBackgroundConfig | null): void {
    const draft = mediaBackgroundDraftFromConfig(config);
    this.objectId.set(draft.objectId);
    this.posterObjectId.set(draft.posterObjectId);
    this.previewUrl.set(config?.url ?? null);
    this.previewType.set(config?.mediaType ?? null);
    this.posterUrl.set(config?.posterUrl ?? null);
    this.alt.set(draft.alt);
    this.overlay.set(draft.overlay);
    this.position.set(draft.position);
    this.active.set(draft.active);
  }
}
