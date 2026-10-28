import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { App } from './app.component';
import { AUTH_REPOSITORY } from './features/applications/auth/repositories/auth.repository';
import { PRODUCT_REPOSITORY } from './features/applications/products/repositories/product.repository';
import { CartStore, CartUiStore } from './features/applications/cart/public-api';

@Component({ standalone: true, template: '' })
class StubPageComponent {}

const authRepoStub = {
  login: () => of({ user: { id: 1, email: 'a@a.com', name: 'A' }, token: 't' }),
  register: () => of({ user: { id: 1, email: 'a@a.com', name: 'A' }, token: 't' }),
  refresh: () => of({ user: { id: 1, email: 'a@a.com', name: 'A' }, token: 't' }),
  logout: () => of(true),
};

const productRepoStub = { getStorefront: () => of({ store: null, products: [] }) };

describe('App', () => {
  beforeEach(async () => {
    sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([
          { path: 'i/:token', component: StubPageComponent },
          { path: 'registro/vendedor', component: StubPageComponent },
        ]),
        provideHttpClient(),
        { provide: AUTH_REPOSITORY, useValue: authRepoStub },
        { provide: PRODUCT_REPOSITORY, useValue: productRepoStub },
        {
          provide: CartStore,
          useValue: {
            totalItems: () => 0,
            items: () => [],
            loading: () => false,
            error: () => null,
            totalPrice: () => 0,
            updateQuantity: vi.fn(),
            removeItem: vi.fn(),
            loadCart: vi.fn(),
          },
        },
        { provide: CartUiStore, useValue: { isSidebarOpen: () => false, toggleSidebar: vi.fn() } },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render app layout and navbar', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.app-layout')).toBeTruthy();
    expect(compiled.querySelector('app-navbar')).toBeTruthy();
  });

  it('oculta el chrome del storefront en las invitaciones', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/i/token-demo');
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-navbar')).toBeNull();
    expect(compiled.querySelector('app-footer')).toBeNull();
  });
});
