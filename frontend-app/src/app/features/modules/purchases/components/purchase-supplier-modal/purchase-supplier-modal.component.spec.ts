import { TestBed } from '@angular/core/testing';
import { PurchaseSupplierModalComponent } from './purchase-supplier-modal.component';

describe('PurchaseSupplierModalComponent', () => {
  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [PurchaseSupplierModalComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(PurchaseSupplierModalComponent);
    fixture.componentRef.setInput('open', true);
    fixture.componentRef.setInput('error', null);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('emite un proveedor válido con los campos limpios', async () => {
    const fixture = await setup();
    const saved = vi.fn();
    fixture.componentInstance.save.subscribe(saved);
    fixture.componentInstance.form.patchValue({
      name: '  Distribuidora  ',
      ruc: ' 123 ',
      phone: ' 8888 ',
      email: '',
      address: ' Managua ',
    });

    fixture.componentInstance.submit();

    expect(saved).toHaveBeenCalledWith({
      name: 'Distribuidora',
      ruc: '123',
      phone: '8888',
      email: '',
      address: 'Managua',
    });
  });

  it('no emite un proveedor inválido', async () => {
    const fixture = await setup();
    const saved = vi.fn();
    fixture.componentInstance.save.subscribe(saved);
    fixture.componentInstance.form.patchValue({ name: '', email: 'no-es-correo' });
    fixture.componentInstance.submit();
    expect(saved).not.toHaveBeenCalled();
  });
});
