import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot, convertToParamMap } from '@angular/router';
import { storefrontResolver } from './storefront.resolver';
import { ProductStore } from '../state/product.store';

describe('storefrontResolver', () => {
  const run = (storeId: string | null, store: Record<string, unknown>) => {
    TestBed.configureTestingModule({ providers: [{ provide: ProductStore, useValue: store }] });
    const route = {
      paramMap: convertToParamMap(storeId ? { storeId } : {}),
    } as ActivatedRouteSnapshot;
    return TestBed.runInInjectionContext(() =>
      storefrontResolver(route, {} as RouterStateSnapshot),
    );
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('carga la tienda de la URL cuando no está cargada', async () => {
    const loadStore = vi.fn().mockResolvedValue(undefined);
    await run('t-1', { storeId: () => null, products: () => [], loadStore });

    expect(loadStore).toHaveBeenCalledWith('t-1');
  });

  it('no recarga si la misma tienda ya está cargada', async () => {
    const loadStore = vi.fn();
    await run('t-1', { storeId: () => 't-1', products: () => [{}], loadStore });

    expect(loadStore).not.toHaveBeenCalled();
  });

  it('no hace nada cuando la URL no trae storeId', async () => {
    const loadStore = vi.fn();
    await run(null, { storeId: () => null, products: () => [], loadStore });

    expect(loadStore).not.toHaveBeenCalled();
  });
});
