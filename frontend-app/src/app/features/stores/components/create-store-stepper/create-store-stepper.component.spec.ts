import { TestBed } from '@angular/core/testing';
import { CreateStoreStepperComponent } from './create-store-stepper.component';
import { WIZARD_STEPS } from '../../models/store-wizard.model';

describe('CreateStoreStepperComponent', () => {
  const setup = async (current: number) => {
    await TestBed.configureTestingModule({
      imports: [CreateStoreStepperComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(CreateStoreStepperComponent);
    fixture.componentRef.setInput('steps', WIZARD_STEPS);
    fixture.componentRef.setInput('current', current);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe renderizar todos los pasos y marcar el actual', async () => {
    const fixture = await setup(2);
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelectorAll('[data-testid^="step-"]')).toHaveLength(4);
    expect(host.querySelector('[aria-current="step"]')).not.toBeNull();
  });

  it('no debe marcar ninguno cuando el paso está fuera de rango', async () => {
    const fixture = await setup(0);

    expect(
      (fixture.nativeElement as HTMLElement).querySelector('[aria-current="step"]'),
    ).toBeNull();
  });
});
