import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import {
  MediaBackgroundConfig,
  MediaBackgroundDraft,
} from '../../../../../core/models/media-background.model';
import { STORAGE_REPOSITORY } from '../../../../applications/storage/public-api';
import { MediaBackgroundEditorComponent } from './media-background-editor.component';

const CONFIG: MediaBackgroundConfig = {
  objectId: 'bg-1',
  mediaType: 'video',
  url: '/api/v1/storage/public/objetos/bg-1',
  posterObjectId: 'poster-1',
  posterUrl: '/api/v1/storage/public/objetos/poster-1',
  alt: 'Fondo',
  overlay: 40,
  position: 'top',
  active: true,
};

describe('MediaBackgroundEditorComponent', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<MediaBackgroundEditorComponent>>;
  let component: MediaBackgroundEditorComponent;
  let storage: {
    requestUpload: ReturnType<typeof vi.fn>;
    uploadToUrl: ReturnType<typeof vi.fn>;
    confirm: ReturnType<typeof vi.fn>;
  };
  let save: ReturnType<typeof vi.fn>;

  const setup = async (canEdit = true): Promise<void> => {
    storage = {
      requestUpload: vi.fn(() =>
        of({ objectId: 'obj-1', uploadUrl: 'https://minio.test/upload', headers: {}, maxBytes: 0 }),
      ),
      uploadToUrl: vi.fn(() => of(undefined)),
      confirm: vi.fn(() => of({ id: 'obj-1' })),
    };
    save = vi.fn((draft: MediaBackgroundDraft) =>
      of({
        ...CONFIG,
        objectId: draft.objectId,
        posterObjectId: draft.posterObjectId,
        alt: draft.alt,
        overlay: draft.overlay,
        position: draft.position,
        active: draft.active,
      }),
    );

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [MediaBackgroundEditorComponent],
      providers: [{ provide: STORAGE_REPOSITORY, useValue: storage }],
    }).compileComponents();

    fixture = TestBed.createComponent(MediaBackgroundEditorComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('save', save);
    fixture.componentRef.setInput('canEdit', canEdit);
    fixture.detectChanges();
  };

  it('muestra el fondo actual y permite editar metadatos', async () => {
    await setup();
    fixture.componentRef.setInput('config', CONFIG);
    fixture.detectChanges();

    expect(component.previewUrl()).toBe(CONFIG.url);
    expect(component.previewType()).toBe('video');
    expect(component.alt()).toBe('Fondo');

    component.onAltInput({ target: { value: 'Nuevo' } } as unknown as Event);
    component.onOverlayInput({ target: { value: '70' } } as unknown as Event);
    component.onPositionChange({ target: { value: 'bottom' } } as unknown as Event);
    component.onActiveChange({ target: { checked: false } } as unknown as Event);
    component.guardar();

    expect(save).toHaveBeenCalledWith({
      objectId: 'bg-1',
      posterObjectId: 'poster-1',
      alt: 'Nuevo',
      overlay: 70,
      position: 'bottom',
      active: false,
    });
  });

  it('sube el fondo a storage, lo confirma y actualiza la vista previa', async () => {
    await setup();
    fixture.componentRef.setInput('config', null);
    fixture.detectChanges();

    component.onBackgroundSelected(new File(['video'], 'fondo.mp4', { type: 'video/mp4' }));

    expect(storage.requestUpload).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'fondo.mp4',
        contentType: 'video/mp4',
        isPublic: true,
      }),
    );
    expect(storage.uploadToUrl).toHaveBeenCalled();
    expect(storage.confirm).toHaveBeenCalledWith('obj-1');
    expect(component.objectId()).toBe('obj-1');
    expect(component.previewType()).toBe('video');
    expect(component.active()).toBe(true);
  });

  it('oculta los controles de edición cuando canEdit es false', async () => {
    await setup(false);
    fixture.componentRef.setInput('config', CONFIG);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).not.toContain('Guardar fondo');
  });

  it('renderiza un video de vista previa con poster', async () => {
    await setup();
    fixture.componentRef.setInput('config', CONFIG);
    fixture.detectChanges();

    const video = (fixture.nativeElement as HTMLElement).querySelector('video');
    expect(video).not.toBeNull();
    expect(video?.getAttribute('poster')).toContain('poster-1');
  });
});
