import { resolveProductResourceUrl } from './resource-url.adapter';

describe('resource-url.adapter', () => {
  it('debe conservar URLs absolutas y datos embebidos', () => {
    expect(resolveProductResourceUrl('https://cdn.test/image.jpg', 'https://api.test/api/v1')).toBe(
      'https://cdn.test/image.jpg',
    );
    expect(resolveProductResourceUrl('data:image/png;base64,abc', 'https://api.test/api/v1')).toBe(
      'data:image/png;base64,abc',
    );
  });

  it('debe conservar el prefijo del proxy al resolver rutas públicas', () => {
    expect(
      resolveProductResourceUrl(
        '/api/v1/storage/public/objetos/img-1',
        'https://api.test/api-proxy/api/v1',
      ),
    ).toBe('https://api.test/api-proxy/api/v1/storage/public/objetos/img-1');
  });
});
