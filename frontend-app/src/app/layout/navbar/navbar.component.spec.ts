import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { Navbar } from './navbar.component';
import { AUTH_REPOSITORY } from '../../features/auth/repositories/auth.repository';
import { PRODUCT_REPOSITORY } from '../../features/products/repositories/product.repository';
import { AuthStore } from '../../features/auth/public-api';
import type { User } from '../../features/auth/public-api';
import { CartStore, CartUiStore } from '../../features/cart/public-api';

const authRepoStub = {
  login: () => of({ user: { id: 1, email: 'a@a.com', name: 'A' }, token: 't' }),
  register: () => of({ user: { id: 1, email: 'a@a.com', name: 'A' }, token: 't' }),
  refresh: () => of({ user: { id: 1, email: 'a@a.com', name: 'A' }, token: 't' }),
  logout: () => of(true),
};

const productRepoStub = { getStorefront: () => of({ store: null, products: [] }) };

describe('Navbar', () => {
  let component: Navbar;
  let fixture: ComponentFixture<Navbar>;

  // El store real expone señales (`R-ST-1`); el doble también para que el CD
  // reaccione a los cambios de rol (Angular 22 zoneless).
  const currentUser = signal<User | null>(null);
  const authStoreStub = {
    user: currentUser.asReadonly(),
    isAuthenticated: () => currentUser() !== null,
    logout: vi.fn(),
  };

  beforeEach(async () => {
    currentUser.set(null);
    sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Navbar],
      providers: [
        provideRouter([]),
        { provide: AUTH_REPOSITORY, useValue: authRepoStub },
        { provide: PRODUCT_REPOSITORY, useValue: productRepoStub },
        { provide: AuthStore, useValue: authStoreStub },
        { provide: CartStore, useValue: { totalItems: () => 0 } },
        { provide: CartUiStore, useValue: { toggleSidebar: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Navbar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ADR-22: el enlace es visible siempre; el `vendorGuard` decide el acceso.
  it('debe mostrar el enlace al panel del vendedor sin sesión', async () => {
    currentUser.set(null);
    fixture.detectChanges();

    const desktop = fixture.debugElement.query(By.css('[data-testid="navbar-vendor-link"]'));
    expect(desktop.nativeElement.getAttribute('href')).toBe('/vendedor/inicio');
    expect(
      fixture.debugElement.query(By.css('[data-testid="navbar-vendor-link-mobile"]')),
    ).toBeTruthy();
  });

  it('debe mostrar el enlace al panel del vendedor con rol comprador', async () => {
    currentUser.set({ id: 2, name: 'Cami', email: 'c@c.com', role: 'comprador' });
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('[data-testid="navbar-vendor-link"]'))).toBeTruthy();
    expect(
      fixture.debugElement.query(By.css('[data-testid="navbar-vendor-link-mobile"]')),
    ).toBeTruthy();
  });

  it('debe mostrar el enlace al panel del vendedor con rol vendedor', async () => {
    currentUser.set({ id: 1, name: 'Vera', email: 'v@v.com', role: 'vendedor' });
    fixture.detectChanges();

    const desktop = fixture.debugElement.query(By.css('[data-testid="navbar-vendor-link"]'));
    expect(desktop.nativeElement.getAttribute('href')).toBe('/vendedor/inicio');
    expect(
      fixture.debugElement.query(By.css('[data-testid="navbar-vendor-link-mobile"]')),
    ).toBeTruthy();
  });

  // ADR-24: sin sesión, Facturación abre el alta de cuenta de facturador.
  it('debe enlazar facturación al alta de facturador sin sesión', async () => {
    currentUser.set(null);
    fixture.detectChanges();

    const desktop = fixture.debugElement.query(By.css('[data-testid="navbar-billing-link"]'));
    expect(desktop.nativeElement.getAttribute('href')).toBe(
      '/register?rol=biller&returnUrl=%2Ffacturacion%2Fnueva',
    );
    expect(
      fixture.debugElement.query(By.css('[data-testid="navbar-billing-link-mobile"]')),
    ).toBeTruthy();
  });

  it('debe llevar facturación directo al módulo cuando hay sesión', async () => {
    currentUser.set({ id: 1, name: 'Vera', email: 'v@v.com', role: 'vendedor' });
    fixture.detectChanges();

    const desktop = fixture.debugElement.query(By.css('[data-testid="navbar-billing-link"]'));
    expect(desktop.nativeElement.getAttribute('href')).toBe('/facturacion/nueva');
  });
});
