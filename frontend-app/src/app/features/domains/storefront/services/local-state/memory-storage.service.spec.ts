import { MemoryStorageService } from './memory-storage.service';

describe('MemoryStorageService', () => {
  it('debe guardar, leer y eliminar valores en memoria', () => {
    const service = new MemoryStorageService();

    service.set('ecom_demo', 'valor');

    expect(service.get('ecom_demo')).toBe('valor');

    service.remove('ecom_demo');

    expect(service.get('ecom_demo')).toBeNull();
  });

  it('debe aislar los valores entre instancias', () => {
    const first = new MemoryStorageService();
    const second = new MemoryStorageService();

    first.set('ecom_demo', 'valor');

    expect(second.get('ecom_demo')).toBeNull();
  });

  it('debe vaciar todos los valores con clear', () => {
    const service = new MemoryStorageService();
    service.set('ecom_uno', '1');
    service.set('ecom_dos', '2');

    service.clear();

    expect(service.get('ecom_uno')).toBeNull();
    expect(service.get('ecom_dos')).toBeNull();
  });
});
