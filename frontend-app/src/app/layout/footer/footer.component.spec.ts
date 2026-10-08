import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { Footer } from './footer.component';
import { PRODUCT_REPOSITORY } from '../../features/products/repositories/product.repository';

const productRepoStub = { getStorefront: () => of({ store: null, products: [] }) };

describe('Footer', () => {
  let component: Footer;
  let fixture: ComponentFixture<Footer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Footer],
      providers: [provideRouter([]), { provide: PRODUCT_REPOSITORY, useValue: productRepoStub }],
    }).compileComponents();

    fixture = TestBed.createComponent(Footer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
