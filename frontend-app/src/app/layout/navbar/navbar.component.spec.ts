import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { Navbar } from './navbar.component';
import { AUTH_REPOSITORY } from '../../features/auth/repositories/auth.repository';
import { PRODUCT_REPOSITORY } from '../../features/products/repositories/product.repository';

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

  beforeEach(async () => {
    sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Navbar],
      providers: [
        provideRouter([]),
        { provide: AUTH_REPOSITORY, useValue: authRepoStub },
        { provide: PRODUCT_REPOSITORY, useValue: productRepoStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Navbar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
