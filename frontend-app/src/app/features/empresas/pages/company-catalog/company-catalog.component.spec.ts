import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import CompanyCatalogComponent from './company-catalog.component';

describe('CompanyCatalogComponent', () => {
  let fixture: ComponentFixture<CompanyCatalogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompanyCatalogComponent],
      providers: [provideRouter([])],
    })
      .overrideComponent(CompanyCatalogComponent, { set: { template: '<span></span>' } })
      .compileComponents();

    fixture = TestBed.createComponent(CompanyCatalogComponent);
    fixture.detectChanges();
  });

  it('expone el page del catálogo dentro del workspace de empresa', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
