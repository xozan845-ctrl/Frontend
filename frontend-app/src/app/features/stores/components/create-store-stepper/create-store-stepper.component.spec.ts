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

  it('debe exponer el nombre de cada paso en el árbol de accesibilidad', async () => {
    const fixture = await setup(1);
    const steps = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>(
        '[data-testid^="step-"]',
      ),
    );
    const labels = ['Cuenta', 'Tienda', 'Productos', 'Listo'];

    expect(steps).toHaveLength(4);
    steps.forEach((step, index) => expect(step.textContent).toContain(labels[index]));
  });

  it('debe marcar el icono de los pasos completados como decorativo', async () => {
    const fixture = await setup(3);
    const icon = (fixture.nativeElement as HTMLElement).querySelector('i.fa-check');

    expect(icon?.getAttribute('aria-hidden')).toBe('true');
  });
});
