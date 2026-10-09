import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { App } from './app.component';
import { AUTH_REPOSITORY } from './features/auth/repositories/auth.repository';
import { PRODUCT_REPOSITORY } from './features/products/repositories/product.repository';
import { CartStore } from './features/cart/public-api';

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
        provideRouter([]),
        provideHttpClient(),
        { provide: AUTH_REPOSITORY, useValue: authRepoStub },
        { provide: PRODUCT_REPOSITORY, useValue: productRepoStub },
        {
          provide: CartStore,
          useValue: {
            totalItems: () => 0,
            isSidebarOpen: () => false,
            items: () => [],
            loading: () => false,
            error: () => null,
            totalPrice: () => 0,
            toggleSidebar: vi.fn(),
            updateQuantity: vi.fn(),
            removeItem: vi.fn(),
            loadCart: vi.fn(),
          },
        },
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
});
