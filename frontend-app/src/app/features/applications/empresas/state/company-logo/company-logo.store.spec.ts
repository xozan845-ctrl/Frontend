import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { NotificationService } from '../../../../../core/services/notification/notification.service';
import { STORAGE_REPOSITORY, StorageRepository } from '../../../storage/public-api';
import { COMPANY_REPOSITORY, CompanyRepository } from '../../repositories/company.repository';
import { Company } from '../../models/company.model';
import { CompanyStore } from '../company/company.store';
import { CompanyLogoStore } from './company-logo.store';

const company: Company = {
  id: 'c-1',
  name: 'Mi Empresa',
  logisticsMode: 'plataforma',
  type: 'comercial',
  status: 'activa',
  createdBy: 'u-1',
  createdAt: '2026-10-21T00:00:00.000Z',
};

describe('CompanyLogoStore', () => {
  let companyRepo: CompanyRepository;
  let storageRepo: StorageRepository;
  let companySignal: WritableSignal<Company | null>;
  let companyStore: {
    company: () => Company | null;
    applyCompanyUpdate: ReturnType<typeof vi.fn>;
  };
  let notification: { showSuccess: ReturnType<typeof vi.fn>; showError: ReturnType<typeof vi.fn> };

  const setup = () => {
    companySignal = signal<Company | null>(company);
    companyRepo = {
      create: vi.fn(),
      getById: vi.fn(),
      updateProfile: vi.fn(() =>
        of<Company>({ ...company, logoObjectId: 'o-1', logoUrl: 'https://cdn.test/logo.png' }),
      ),
      updateSlug: vi.fn(),
      updateType: vi.fn(),
      updateLogistics: vi.fn(),
      createSeller: vi.fn(),
    };
    storageRepo = {
      bucket: vi.fn(),
      objects: vi.fn(),
      requestUpload: vi.fn(() =>
        of({
          objectId: 'o-1',
          bucket: 'bucket',
          key: 'logo.png',
          uploadUrl: 'https://upload.test/logo.png',
          method: 'PUT',
          headers: { 'content-type': 'image/png' },
          expiresAt: '',
          maxBytes: 0,
        }),
      ),
      uploadToUrl: vi.fn(() => of(undefined)),
      confirm: vi.fn(() =>
        of({
          id: 'o-1',
          bucket: 'bucket',
          key: 'logo.png',
          name: 'logo.png',
          contentType: 'image/png',
          folder: 'empresa/logo',
          description: '',
          tags: {},
          sizeBytes: 4,
          status: 'activo' as const,
          uploadedBy: null,
          createdAt: '',
          confirmedAt: '',
          deletedAt: null,
        }),
      ),
      download: vi.fn(),
      delete: vi.fn(),
    };
    companyStore = {
      company: companySignal.asReadonly(),
      applyCompanyUpdate: vi.fn(),
    };
    notification = { showSuccess: vi.fn(), showError: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        CompanyLogoStore,
        { provide: COMPANY_REPOSITORY, useValue: companyRepo },
        { provide: STORAGE_REPOSITORY, useValue: storageRepo },
        { provide: CompanyStore, useValue: companyStore },
        { provide: NotificationService, useValue: notification },
      ],
    });
    return TestBed.inject(CompanyLogoStore);
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe subir, confirmar y asociar el logo a la empresa', async () => {
    const store = setup();
    const file = new File(['logo'], 'logo.png', { type: 'image/png' });

    store.upload(file);

    await vi.waitFor(() => expect(store.uploading()).toBe(false));
    expect(storageRepo.requestUpload).toHaveBeenCalledWith({
      name: 'logo.png',
      contentType: 'image/png',
      sizeBytes: file.size,
      folder: 'empresa/logo',
      description: 'Logo de Mi Empresa',
    });
    expect(storageRepo.uploadToUrl).toHaveBeenCalledWith(
      'https://upload.test/logo.png',
      { 'content-type': 'image/png' },
      file,
    );
    expect(storageRepo.confirm).toHaveBeenCalledWith('o-1');
    expect(companyRepo.updateProfile).toHaveBeenCalledWith('c-1', { logoObjectId: 'o-1' });
    expect(companyStore.applyCompanyUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ logoObjectId: 'o-1' }),
    );
    expect(notification.showSuccess).toHaveBeenCalledWith('Logo actualizado.');
  });

  it('debe rechazar un archivo que no es imagen', async () => {
    const store = setup();

    store.upload(new File(['texto'], 'logo.txt', { type: 'text/plain' }));

    await vi.waitFor(() => expect(store.error()).toBe('El logo debe ser una imagen.'));
    expect(storageRepo.requestUpload).not.toHaveBeenCalled();
    expect(store.uploading()).toBe(false);
  });

  it('debe respetar el tamaño máximo de la url prefirmada', async () => {
    const store = setup();
    vi.mocked(storageRepo.requestUpload).mockReturnValue(
      of({
        objectId: 'o-1',
        bucket: 'bucket',
        key: 'logo.png',
        uploadUrl: 'https://upload.test/logo.png',
        method: 'PUT',
        headers: {},
        expiresAt: '',
        maxBytes: 1,
      }),
    );

    store.upload(new File(['logo'], 'logo.png', { type: 'image/png' }));

    await vi.waitFor(() =>
      expect(store.error()).toBe('El logo supera el tamaño máximo permitido.'),
    );
    expect(storageRepo.uploadToUrl).not.toHaveBeenCalled();
  });

  it('debe registrar el error si falla la asociación', async () => {
    const store = setup();
    vi.mocked(companyRepo.updateProfile).mockReturnValue(throwError(() => new Error('')));

    store.upload(new File(['logo'], 'logo.png', { type: 'image/png' }));

    await vi.waitFor(() => expect(store.error()).toBe('No se pudo subir el logo.'));
    expect(store.uploading()).toBe(false);
    expect(notification.showError).toHaveBeenCalled();
  });

  it('debe limpiar el error y reiniciar el estado', async () => {
    const store = setup();
    vi.mocked(storageRepo.requestUpload).mockReturnValue(throwError(() => new Error('boom')));

    store.upload(new File(['logo'], 'logo.png', { type: 'image/png' }));
    await vi.waitFor(() => expect(store.error()).toBe('boom'));

    store.clearError();
    expect(store.error()).toBeNull();

    store.reset();
    expect(store.uploading()).toBe(false);
    expect(store.error()).toBeNull();
  });
});
