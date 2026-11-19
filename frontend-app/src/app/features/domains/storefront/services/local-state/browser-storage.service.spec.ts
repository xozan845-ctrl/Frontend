import { BrowserStorageService } from './browser-storage.service';

describe('BrowserStorageService', () => {
  const service = new BrowserStorageService();

  afterEach(() => localStorage.clear());

  it('debe guardar, leer y eliminar valores de localStorage', () => {
    service.set('ecom_demo', 'valor');

    expect(localStorage.getItem('ecom_demo')).toBe('valor');
    expect(service.get('ecom_demo')).toBe('valor');

    service.remove('ecom_demo');

    expect(service.get('ecom_demo')).toBeNull();
  });

  it('debe propagar el error cuando el almacenamiento no está disponible', () => {
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage bloqueado');
    });

    expect(() => service.get('ecom_demo')).toThrow('storage bloqueado');

    spy.mockRestore();
  });
});
