import { TestBed } from '@angular/core/testing';
import { SpinnerComponent } from './spinner.component';

describe('SpinnerComponent', () => {
  const setup = () => {
    TestBed.configureTestingModule({ imports: [SpinnerComponent] });
    const fixture = TestBed.createComponent(SpinnerComponent);
    fixture.detectChanges();
    return fixture;
  };

  it('debe renderizar tres barras animadas', () => {
    const fixture = setup();
    const container = (fixture.nativeElement as HTMLElement).querySelector('div') as HTMLDivElement;

    expect(container.children.length).toBe(3);
  });

  it('debe respetar el tamaño y la altura mínima', () => {
    const fixture = setup();
    fixture.componentRef.setInput('size', 'xl');
    fixture.componentRef.setInput('minHeight', '200px');
    fixture.detectChanges();

    const container = (fixture.nativeElement as HTMLElement).querySelector('div') as HTMLDivElement;
    expect(container.style.minHeight).toBe('200px');
    expect((fixture.nativeElement as HTMLElement).querySelector('.h-16')).not.toBeNull();
  });
});
