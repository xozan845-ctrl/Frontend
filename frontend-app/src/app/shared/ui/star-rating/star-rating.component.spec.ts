import { TestBed } from '@angular/core/testing';
import { StarRatingComponent } from './star-rating.component';

describe('StarRatingComponent', () => {
  const setup = () => {
    TestBed.configureTestingModule({ imports: [StarRatingComponent] });
    const fixture = TestBed.createComponent(StarRatingComponent);
    fixture.detectChanges();
    return fixture;
  };

  it('debe exponer la calificación como nombre accesible', () => {
    const fixture = setup();
    fixture.componentRef.setInput('value', 4);
    fixture.detectChanges();

    const group = (fixture.nativeElement as HTMLElement).querySelector('[role="group"]');
    expect(group?.getAttribute('aria-label')).toBe('Calificación: 4 de 5 estrellas');
  });

  it('debe mostrar el conteo de reseñas cuando se solicita', () => {
    const fixture = setup();
    fixture.componentRef.setInput('value', 5);
    fixture.componentRef.setInput('reviewCount', 12);
    fixture.componentRef.setInput('showCount', true);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('(12)');
  });

  it('no debe emitir selección si no es interactivo', () => {
    const fixture = setup();
    const emitted = vi.fn();
    fixture.componentInstance.valueChange.subscribe(emitted);

    fixture.componentInstance.onSelect(3);

    expect(emitted).not.toHaveBeenCalled();
  });

  it('debe emitir la calificación seleccionada cuando es interactivo', () => {
    const fixture = setup();
    const emitted = vi.fn();
    fixture.componentInstance.valueChange.subscribe(emitted);
    fixture.componentRef.setInput('interactive', true);
    fixture.detectChanges();

    (fixture.nativeElement as HTMLElement)
      .querySelector('[aria-label="Dar 3 estrellas"]')!
      .dispatchEvent(new Event('click'));

    expect(emitted).toHaveBeenCalledWith(3);
  });
});
