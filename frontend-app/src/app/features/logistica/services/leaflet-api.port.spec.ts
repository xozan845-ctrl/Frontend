import { resolveLeaflet } from './leaflet-api';

describe('resolveLeaflet', () => {
  it('debe preferir el default cuando el bundler expone la API como CJS', () => {
    const api = { map: vi.fn() };

    expect(resolveLeaflet({ default: api } as never)).toBe(api);
  });

  it('debe usar el namespace cuando expone named exports', () => {
    const api = { map: vi.fn() };

    expect(resolveLeaflet(api as never)).toBe(api);
  });
});
