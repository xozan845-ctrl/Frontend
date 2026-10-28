import { TestBed } from '@angular/core/testing';
import { PayableFormComponent } from './payable-form.component';

describe('PayableFormComponent', () => {
  const setup = async () => {
    await TestBed.configureTestingModule({ imports: [PayableFormComponent] }).compileComponents();
    const fixture = TestBed.createComponent(PayableFormComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe emitir una cuenta válida y reiniciar el formulario', async () => {
    const fixture = await setup();
    const component = fixture.componentInstance;
    const created = vi.fn();
    component.create.subscribe(created);
    component.form.patchValue({
      supplier: '  Proveedor  ',
      concept: '  Factura  ',
      dueDate: '2026-11-01',
      amount: 250,
    });

    component.submit();

    expect(created).toHaveBeenCalledWith({
      supplier: 'Proveedor',
      concept: 'Factura',
      dueDate: '2026-11-01',
      amount: 250,
    });
    expect(component.form.controls.supplier.value).toBe('');
    expect(component.form.controls.amount.value).toBe(0);
  });

  it('no debe emitir cuentas inválidas', async () => {
    const fixture = await setup();
    const created = vi.fn();
    fixture.componentInstance.create.subscribe(created);

    fixture.componentInstance.submit();

    expect(created).not.toHaveBeenCalled();
    expect(fixture.componentInstance.form.controls.supplier.touched).toBe(true);
  });
});
