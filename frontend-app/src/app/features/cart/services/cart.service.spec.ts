import { TestBed } from '@angular/core/testing';
import { CartService } from './cart.service';

describe('CartService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('debe confirmar el guardado del carrito', () => {
    const service = TestBed.inject(CartService);
    let result: boolean | undefined;

    service.saveCart([]).subscribe((r) => (result = r));

    expect(result).toBe(true);
  });

  it('debe devolver un carrito vacío al no haber backend de sincronización', () => {
    const service = TestBed.inject(CartService);
    let result: unknown[] | undefined;

    service.fetchCart().subscribe((r) => (result = r));

    expect(result).toEqual([]);
  });
});
