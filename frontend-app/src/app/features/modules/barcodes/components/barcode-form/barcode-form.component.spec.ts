import { TestBed } from '@angular/core/testing';
import { BarcodeFormComponent } from './barcode-form.component';

describe('BarcodeFormComponent', () => {
  const setup = async (error: string | null = null) => {
    await TestBed.configureTestingModule({ imports: [BarcodeFormComponent] }).compileComponents();
    const fixture = TestBed.createComponent(BarcodeFormComponent);
    fixture.componentRef.setInput('error', error);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe emitir una etiqueta válida y reiniciar el formulario', async () => {
    const fixture = await setup();
    const component = fixture.componentInstance;
    const created = vi.fn();
    component.createLabel.subscribe(created);
    component.form.patchValue({
      productName: '  Camisa  ',
      sku: '  SKU-1  ',
      symbology: 'CODE128',
      code: '  BC-1  ',
      copies: 4,
    });

    component.submit();

    expect(created).toHaveBeenCalledWith({
      productName: 'Camisa',
      sku: 'SKU-1',
      symbology: 'CODE128',
      code: 'BC-1',
      copies: 4,
    });
    expect(component.form.controls.productName.value).toBe('');
    expect(component.form.controls.copies.value).toBe(1);
  });

  it('no debe emitir etiquetas inválidas', async () => {
    const fixture = await setup();
    const created = vi.fn();
    fixture.componentInstance.createLabel.subscribe(created);

    fixture.componentInstance.submit();

    expect(created).not.toHaveBeenCalled();
    expect(fixture.componentInstance.form.controls.productName.touched).toBe(true);
  });

  it('debe mostrar el error de la etiqueta', async () => {
    const fixture = await setup('Código inválido');

    expect(fixture.nativeElement.textContent).toContain('Código inválido');
  });
});
