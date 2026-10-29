import { TestBed } from '@angular/core/testing';
import { ExpenseModalComponent } from './expense-modal.component';
import type { ExpenseRecord } from '../../../../domains/expenses/public-api';

const CATEGORIES = [
  { value: 'publicidad', label: 'Publicidad' },
  { value: 'renta', label: 'Renta' },
];

const EXPENSE: ExpenseRecord = {
  id: 'expense-1',
  date: '2026-10-29',
  concept: 'Publicidad',
  category: 'publicidad',
  type: 'inmediato',
  amount: 100,
  paymentMethod: 'efectivo',
  status: 'pagado',
  includesVat: false,
  irRetention: 0,
  beneficiary: '',
  notes: '',
  scheduledFor: '',
  recurrence: '',
  createdAt: '2026-10-29T12:00:00.000Z',
};

describe('ExpenseModalComponent', () => {
  const setup = async (expense: ExpenseRecord | null = null) => {
    await TestBed.configureTestingModule({ imports: [ExpenseModalComponent] }).compileComponents();
    const fixture = TestBed.createComponent(ExpenseModalComponent);
    fixture.componentRef.setInput('open', true);
    fixture.componentRef.setInput('categories', CATEGORIES);
    if (expense) fixture.componentRef.setInput('expense', expense);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe emitir un gasto válido', async () => {
    const fixture = await setup();
    const component = fixture.componentInstance;
    const saved = vi.fn();
    component.save.subscribe(saved);
    component.form.patchValue({
      concept: '  Publicidad  ',
      amount: 250,
      beneficiary: '  Ana  ',
      includesVat: true,
    });

    component.submit();

    expect(saved).toHaveBeenCalledWith(
      expect.objectContaining({
        concept: 'Publicidad',
        amount: 250,
        beneficiary: 'Ana',
        includesVat: true,
        category: 'publicidad',
        type: 'inmediato',
      }),
    );
  });

  it('debe permitir una categoría personalizada', async () => {
    const fixture = await setup();
    const component = fixture.componentInstance;
    const saved = vi.fn();
    component.save.subscribe(saved);
    component.toggleCustomCategory();
    component.form.patchValue({
      concept: 'Gasto',
      customCategory: '  Oficina  ',
      amount: 10,
    });

    component.submit();

    expect(saved).toHaveBeenCalledWith(expect.objectContaining({ category: 'Oficina' }));
  });

  it('debe cargar el gasto existente y no emitir si es inválido', async () => {
    const fixture = await setup(EXPENSE);
    const component = fixture.componentInstance;
    const saved = vi.fn();
    component.save.subscribe(saved);

    expect(component.isEditing()).toBe(true);
    expect(component.form.controls.concept.value).toBe('Publicidad');
    component.form.patchValue({ concept: '' });
    component.submit();

    expect(saved).not.toHaveBeenCalled();
  });
});
