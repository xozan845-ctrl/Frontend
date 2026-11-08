import { TestBed } from '@angular/core/testing';
import CompanyCreateFormComponent from './company-create-form.component';

describe('CompanyCreateFormComponent', () => {
  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [CompanyCreateFormComponent],
    }).compileComponents();
    return TestBed.createComponent(CompanyCreateFormComponent);
  };

  it('emite la empresa con nombre, slug y modalidad', async () => {
    const fixture = await setup();
    const created = vi.fn();
    fixture.componentInstance.createCompany.subscribe(created);
    fixture.componentInstance.form.patchValue({
      name: 'Mi Empresa',
      slug: 'mi-empresa',
      logisticsMode: 'hibrida',
    });

    fixture.componentInstance.onSubmit();

    expect(created).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Mi Empresa',
        slug: 'mi-empresa',
        logisticsMode: 'hibrida',
      }),
    );
  });

  it('no emite si el formulario es inválido', async () => {
    const fixture = await setup();
    const created = vi.fn();
    fixture.componentInstance.createCompany.subscribe(created);
    fixture.componentInstance.form.controls.name.setValue('X');

    fixture.componentInstance.onSubmit();

    expect(created).not.toHaveBeenCalled();
  });
});
