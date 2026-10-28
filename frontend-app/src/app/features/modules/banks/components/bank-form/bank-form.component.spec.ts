import { TestBed } from '@angular/core/testing';
import { BankFormComponent } from './bank-form.component';
import type { BankAccount } from '../../../../banks/public-api';

const ACCOUNT: BankAccount = {
  id: 'bank-1',
  bank: 'Banco Lafise',
  alias: 'Operativa',
  accountNumber: '123456',
  type: 'corriente',
  balance: 500,
};

describe('BankFormComponent', () => {
  const setup = async (account: BankAccount | null = null) => {
    await TestBed.configureTestingModule({ imports: [BankFormComponent] }).compileComponents();
    const fixture = TestBed.createComponent(BankFormComponent);
    fixture.componentRef.setInput('account', account);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe emitir una cuenta válida en modo alta', async () => {
    const fixture = await setup();
    const component = fixture.componentInstance;
    const saved = vi.fn();
    component.saveAccount.subscribe(saved);
    component.form.patchValue({
      bank: '  Banco  ',
      alias: '  Caja  ',
      accountNumber: ' 1 ',
      type: 'ahorro',
      balance: 100,
    });

    component.submit();

    expect(saved).toHaveBeenCalledWith({
      bank: 'Banco',
      alias: 'Caja',
      accountNumber: '1',
      type: 'ahorro',
      balance: 100,
    });
  });

  it('debe rellenar el formulario al editar y emitir la actualización', async () => {
    const fixture = await setup(ACCOUNT);
    const component = fixture.componentInstance;
    const saved = vi.fn();
    const cancelled = vi.fn();
    component.saveAccount.subscribe(saved);
    component.cancelEdit.subscribe(cancelled);

    expect(component.isEditing()).toBe(true);
    expect(component.form.getRawValue()).toMatchObject({
      bank: 'Banco Lafise',
      alias: 'Operativa',
      accountNumber: '123456',
      type: 'corriente',
      balance: 500,
    });

    component.form.patchValue({ balance: 750 });
    component.submit();
    (fixture.nativeElement.querySelector('.btn-secondary') as HTMLButtonElement).click();

    expect(saved).toHaveBeenCalledWith({
      bank: 'Banco Lafise',
      alias: 'Operativa',
      accountNumber: '123456',
      type: 'corriente',
      balance: 750,
    });
    expect(cancelled).toHaveBeenCalled();
  });

  it('no debe emitir cuentas inválidas', async () => {
    const fixture = await setup();
    const saved = vi.fn();
    fixture.componentInstance.saveAccount.subscribe(saved);

    fixture.componentInstance.submit();

    expect(saved).not.toHaveBeenCalled();
    expect(fixture.componentInstance.form.controls.bank.touched).toBe(true);
  });
});
