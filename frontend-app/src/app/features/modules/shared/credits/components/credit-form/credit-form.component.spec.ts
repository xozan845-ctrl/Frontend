import { TestBed } from '@angular/core/testing';
import { CreditFormComponent } from './credit-form.component';

describe('CreditFormComponent', () => {
  const setup = async (error: string | null = null) => {
    await TestBed.configureTestingModule({ imports: [CreditFormComponent] }).compileComponents();
    const fixture = TestBed.createComponent(CreditFormComponent);
    fixture.componentRef.setInput('error', error);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe emitir un crédito válido y reiniciar el formulario', async () => {
    const fixture = await setup();
    const component = fixture.componentInstance;
    const created = vi.fn();
    component.createCredit.subscribe(created);
    component.form.patchValue({
      customer: '  Carla  ',
      concept: '  Pedido  ',
      dueDate: '2026-11-01',
      amount: 250,
    });

    component.submit();

    expect(created).toHaveBeenCalledWith({
      customer: 'Carla',
      concept: 'Pedido',
      dueDate: '2026-11-01',
      amount: 250,
    });
    expect(component.form.controls.customer.value).toBe('');
  });

  it('no debe emitir créditos inválidos', async () => {
    const fixture = await setup();
    const created = vi.fn();
    fixture.componentInstance.createCredit.subscribe(created);

    fixture.componentInstance.submit();

    expect(created).not.toHaveBeenCalled();
    expect(fixture.componentInstance.form.controls.customer.touched).toBe(true);
  });

  it('debe mostrar el error del store', async () => {
    const fixture = await setup('Límite alcanzado');

    expect(fixture.nativeElement.textContent).toContain('Límite alcanzado');
  });
});
