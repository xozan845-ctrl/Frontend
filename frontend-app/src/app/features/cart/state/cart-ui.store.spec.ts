import { TestBed } from '@angular/core/testing';
import { CartUiStore } from './cart-ui.store';

describe('CartUiStore', () => {
  const setup = () => {
    TestBed.configureTestingModule({});
    return TestBed.inject(CartUiStore);
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe iniciar con el sidebar cerrado', () => {
    expect(setup().isSidebarOpen()).toBe(false);
  });

  it('debe alternar el sidebar y aceptar un valor explícito', () => {
    const store = setup();

    store.toggleSidebar();
    expect(store.isSidebarOpen()).toBe(true);

    store.toggleSidebar(false);
    expect(store.isSidebarOpen()).toBe(false);
  });
});
