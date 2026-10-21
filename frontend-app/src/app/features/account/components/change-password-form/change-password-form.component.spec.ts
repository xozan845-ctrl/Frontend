import { TestBed } from '@angular/core/testing';
import { ChangePasswordFormComponent } from './change-password-form.component';

describe('ChangePasswordFormComponent', () => {
  const setup = async (submitting = false) => {
    await TestBed.configureTestingModule({
      imports: [ChangePasswordFormComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(ChangePasswordFormComponent);
    fixture.componentRef.setInput('submitting', submitting);
    fixture.detectChanges();
    return fixture;
  };

  it('no debe emitir si las contraseñas no coinciden', async () => {
    const fixture = await setup();
    const emit = vi.spyOn(fixture.componentInstance.passwordSubmit, 'emit');
    fixture.componentInstance.form.setValue({
      current: 'actual123',
      next: 'nueva12345',
      confirm: 'distinta123',
    });

    fixture.componentInstance.onSubmit();

    expect(emit).not.toHaveBeenCalled();
    expect(fixture.componentInstance.form.hasError('passwordMismatch')).toBe(true);
  });

  it('debe emitir el payload cuando el formulario es válido', async () => {
    const fixture = await setup();
    const emit = vi.spyOn(fixture.componentInstance.passwordSubmit, 'emit');
    fixture.componentInstance.form.setValue({
      current: 'actual123',
      next: 'nueva12345',
      confirm: 'nueva12345',
    });

    fixture.componentInstance.onSubmit();

    expect(emit).toHaveBeenCalledWith({
      current: 'actual123',
      next: 'nueva12345',
    });
  });

  it('no debe emitir mientras la petición está en curso', async () => {
    const fixture = await setup(true);
    const emit = vi.spyOn(fixture.componentInstance.passwordSubmit, 'emit');
    fixture.componentInstance.form.setValue({
      current: 'actual123',
      next: 'nueva12345',
      confirm: 'nueva12345',
    });

    fixture.componentInstance.onSubmit();

    expect(emit).not.toHaveBeenCalled();
  });
});
