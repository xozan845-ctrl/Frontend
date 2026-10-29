import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { Header } from './header.component';
import { AUTH_REPOSITORY } from '../../features/applications/auth/repositories/auth.repository';
import { PRODUCT_REPOSITORY } from '../../features/applications/products/repositories/product.repository';
import { AuthStore } from '../../features/applications/auth/public-api';
import type { User } from '../../features/applications/auth/public-api';
import { CartStore, CartUiStore } from '../../features/applications/cart/public-api';

const authRepoStub = {
  login: () => of({ user: { id: 1, email: 'a@a.com', name: 'A' }, token: 't' }),
  register: () => of({ user: { id: 1, email: 'a@a.com', name: 'A' }, token: 't' }),
  refresh: () => of({ user: { id: 1, email: 'a@a.com', name: 'A' }, token: 't' }),
  logout: () => of(true),
};

const productRepoStub = { getStorefront: () => of({ store: null, products: [] }) };

describe('Header', () => {
  let component: Header;
  let fixture: ComponentFixture<Header>;

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
      imports: [Header],
      providers: [
        provideRouter([]),
        { provide: AUTH_REPOSITORY, useValue: authRepoStub },
        { provide: PRODUCT_REPOSITORY, useValue: productRepoStub },
        { provide: AuthStore, useValue: authStoreStub },
        { provide: CartStore, useValue: { totalItems: () => 0 } },
        { provide: CartUiStore, useValue: { toggleSidebar: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Header);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('expone un header con navegación principal semántica', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('header')).not.toBeNull();
    expect(element.querySelectorAll('header nav[aria-label="Navegación principal"]')).toHaveLength(
      2,
    );
  });

  it('no debe mezclar módulos internos en el header público sin sesión', async () => {
    currentUser.set(null);
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('[data-testid="header-vendor-link"]'))).toBeNull();
    expect(fixture.debugElement.query(By.css('[data-testid="header-billing-link"]'))).toBeNull();
    expect(fixture.debugElement.query(By.css('[data-testid="header-logistica-link"]'))).toBeNull();
  });

  it('no debe mostrar módulos internos a un comprador', async () => {
    currentUser.set({ id: 2, name: 'Cami', email: 'c@c.com', role: 'comprador' });
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('[data-testid="header-vendor-link"]'))).toBeNull();
    expect(fixture.debugElement.query(By.css('[data-testid="header-billing-link"]'))).toBeNull();
    expect(fixture.debugElement.query(By.css('[data-testid="header-logistica-link"]'))).toBeNull();
  });

  it('mantiene el header público sin módulos internos con rol vendedor', async () => {
    currentUser.set({ id: 1, name: 'Vera', email: 'v@v.com', role: 'vendedor' });
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('[data-testid="header-vendor-link"]'))).toBeNull();
    expect(fixture.debugElement.query(By.css('[data-testid="header-billing-link"]'))).toBeNull();
    expect(fixture.debugElement.query(By.css('[data-testid="header-logistica-link"]'))).toBeNull();
  });

  it('muestra el acceso al panel de empresa para un empresario', () => {
    currentUser.set({
      id: 3,
      name: 'Eva',
      email: 'e@e.com',
      role: 'empresario',
      tenantId: 'company-1',
    });
    fixture.detectChanges();

    const link = fixture.debugElement.query(By.css('[data-testid="header-company-link"]'));
    expect(link).not.toBeNull();
    expect(link.nativeElement.textContent).toContain('Panel empresa');
    expect(component.homeLink()).toEqual(['/empresa/inicio']);
  });
});
