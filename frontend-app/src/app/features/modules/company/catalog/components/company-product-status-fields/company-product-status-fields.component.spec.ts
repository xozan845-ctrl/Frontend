import { FormControl, FormGroup } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import CompanyProductStatusFieldsComponent from './company-product-status-fields.component';

describe('CompanyProductStatusFieldsComponent', () => {
  it('renderiza estado y fecha del formulario', async () => {
    const form = new FormGroup({
      status: new FormControl('activo'),
      createdAt: new FormControl('2026-11-01'),
    });
    await TestBed.configureTestingModule({
      imports: [CompanyProductStatusFieldsComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(CompanyProductStatusFieldsComponent);
    fixture.componentRef.setInput('form', form);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('[data-testid="product-modal-status"]')).not.toBeNull();
    expect(host.querySelector('[data-testid="product-modal-created-at"]')).not.toBeNull();
  });
});
