import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { App } from './app.component';
import { RuntimeConfigService } from './core/config/runtime-config.service';
import { StoreConfigService } from './core/services/store-config/store-config.service';
import { AUTH_REPOSITORY } from './features/domains/session/public-api';
import { PRODUCT_REPOSITORY, ProductStore } from './features/domains/storefront/public-api';
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

  it('should render app layout and header', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.app-layout')).toBeTruthy();
    expect(compiled.querySelector('app-header')).toBeTruthy();
  });

  it('oculta el chrome del storefront en las invitaciones', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/i/token-demo');
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-header')).toBeNull();
    expect(compiled.querySelector('app-footer')).toBeNull();
  });

  it('no hereda identidad ni promesas al pasar de una tienda a otra', async () => {
    const configs: Record<string, Record<string, unknown>> = {
      'tienda-a': {
        name: 'Tienda A',
        email: 'hola@a.test',
        phone: '111222333',
        socials: { instagram: 'https://instagram.com/a' },
        benefits: [{ icon: 'fa-truck', title: 'Envío A' }],
      },
      'tienda-b': { name: 'Tienda B' },
    };
    TestBed.overrideProvider(RuntimeConfigService, {
      useValue: { storefrontFor: (storeId: string) => configs[storeId] },
    });

    const fixture = TestBed.createComponent(App);
    const productStore = TestBed.inject(ProductStore);
    const storeConfig = TestBed.inject(StoreConfigService);

    productStore.loadStore('tienda-a');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(storeConfig.companyInfo().email).toBe('hola@a.test');
    expect(storeConfig.benefits()[0]?.title).toBe('Envío A');

    productStore.loadStore('tienda-b');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const config = storeConfig.companyInfo();
    expect(config.name).toBe('Tienda B');
    expect(config.email).toBeUndefined();
    expect(config.phone).toBeUndefined();
    expect(config.socials).toEqual({});
    expect(storeConfig.benefits()).toEqual([]);

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).not.toContain('hola@a.test');
    expect(compiled.textContent).not.toContain('111222333');
    expect(compiled.textContent).not.toContain('Envío A');
    expect(compiled.querySelector('[data-testid="footer-socials"]')).toBeNull();
    expect(compiled.querySelector('[data-testid="trust-badges"]')).toBeNull();
  });
});
