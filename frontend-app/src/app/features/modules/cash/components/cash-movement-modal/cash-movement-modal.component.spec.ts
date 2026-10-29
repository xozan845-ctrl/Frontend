import { TestBed } from '@angular/core/testing';
import { CashMovementModalComponent } from './cash-movement-modal.component';
import type { CashMovement } from '../../../../domains/cash/public-api';

const MOVEMENT: CashMovement = {
  id: 'cash-1',
  date: '2026-10-29',
  type: 'ingreso',
  concept: 'Venta de contado',
  category: 'venta',
  amount: 100,
  paymentMethod: 'efectivo',
  status: 'confirmado',
  account: 'caja-general',
  source: 'manual',
  reference: 'REC-1',
  counterpart: 'Ana',
  notes: '',
  createdAt: '2026-10-29T12:00:00.000Z',
};

describe('CashMovementModalComponent', () => {
  const setup = async (
    movement: CashMovement | null = null,
    preset: Partial<CashMovement> | null = null,
  ) => {
    await TestBed.configureTestingModule({
      imports: [CashMovementModalComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(CashMovementModalComponent);
    fixture.componentRef.setInput('open', true);
    if (movement) fixture.componentRef.setInput('movement', movement);
    if (preset) fixture.componentRef.setInput('preset', preset);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe emitir un movimiento válido', async () => {
    const fixture = await setup();
    const component = fixture.componentInstance;
    const saved = vi.fn();
    component.save.subscribe(saved);
    component.form.patchValue({
      concept: '  Venta  ',
      amount: 250,
      counterpart: '  Ana  ',
      reference: '  REC-9  ',
      notes: '  Nota  ',
    });

    component.submit();

    expect(saved).toHaveBeenCalledWith(
      expect.objectContaining({
        concept: 'Venta',
        amount: 250,
        counterpart: 'Ana',
        reference: 'REC-9',
        notes: 'Nota',
        type: 'ingreso',
        category: 'venta',
        account: 'caja-general',
      }),
    );
  });

  it('debe aplicar el preset de caja chica o transferencia', async () => {
    const fixture = await setup(null, {
      type: 'egreso',
      category: 'caja-chica',
      account: 'caja-general',
    });
    const component = fixture.componentInstance;

    expect(component.form.controls.type.value).toBe('egreso');
    expect(component.form.controls.category.value).toBe('caja-chica');
  });

  it('debe cargar el movimiento existente', async () => {
    const fixture = await setup(MOVEMENT);
    const component = fixture.componentInstance;

    expect(component.isEditing()).toBe(true);
    expect(component.form.controls.concept.value).toBe('Venta de contado');
    expect(component.form.controls.amount.value).toBe(100);
    expect(component.form.controls.reference.value).toBe('REC-1');
  });

  it('debe cambiar la categoría al alternar el tipo', async () => {
    const fixture = await setup();
    const component = fixture.componentInstance;

    component.form.controls.category.setValue('gasto');
    component.selectType('ingreso');
    expect(component.form.controls.category.value).toBe('venta');

    component.selectType('egreso');
    expect(component.form.controls.category.value).toBe('gasto');
  });

  it('no debe emitir si el formulario es inválido', async () => {
    const fixture = await setup();
    const component = fixture.componentInstance;
    const saved = vi.fn();
    component.save.subscribe(saved);
    component.form.patchValue({ concept: '', amount: 0 });

    component.submit();

    expect(saved).not.toHaveBeenCalled();
    expect(component.isInvalid('concept')).toBe(true);
    expect(component.isInvalid('amount')).toBe(true);
  });
});
