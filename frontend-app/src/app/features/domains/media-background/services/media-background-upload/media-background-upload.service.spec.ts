import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { STORAGE_REPOSITORY } from '../../../../applications/storage/public-api';
import { MediaBackgroundUploadService } from './media-background-upload.service';

describe('MediaBackgroundUploadService', () => {
  const storage = {
    requestUpload: vi.fn(() =>
      of({ objectId: 'obj-1', uploadUrl: 'https://minio.test/upload', headers: {}, maxBytes: 0 }),
    ),
    uploadToUrl: vi.fn(() => of(undefined)),
    confirm: vi.fn(() => of({ id: 'obj-1' })),
  };

  const setup = () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [MediaBackgroundUploadService, { provide: STORAGE_REPOSITORY, useValue: storage }],
    });
    return TestBed.inject(MediaBackgroundUploadService);
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('solicita, sube y confirma un video, y devuelve el objeto público', () => {
    const service = setup();
    const file = new File(['video'], 'fondo.mp4', { type: 'video/mp4' });
    let resultado: unknown;

    service.upload(file, { folder: 'plataforma', description: 'Fondo' }).subscribe((value) => {
      resultado = value;
    });

    expect(storage.requestUpload).toHaveBeenCalledWith({
      name: 'fondo.mp4',
      contentType: 'video/mp4',
      sizeBytes: file.size,
      folder: 'plataforma',
      description: 'Fondo',
      isPublic: true,
    });
    expect(storage.uploadToUrl).toHaveBeenCalledWith('https://minio.test/upload', {}, file);
    expect(storage.confirm).toHaveBeenCalledWith('obj-1');
    expect(resultado).toEqual({
      objectId: 'obj-1',
      url: expect.stringContaining('/api/v1/storage/public/objetos/obj-1'),
      mediaType: 'video',
    });
  });

  it('clasifica como imagen un archivo que no es video', () => {
    const service = setup();
    let resultado: { mediaType?: string } | undefined;

    service
      .upload(new File(['image'], 'fondo.png', { type: 'image/png' }), {
        folder: 'empresas',
        description: 'Fondo',
      })
      .subscribe((value) => {
        resultado = value;
      });

    expect(resultado?.mediaType).toBe('imagen');
  });
});
