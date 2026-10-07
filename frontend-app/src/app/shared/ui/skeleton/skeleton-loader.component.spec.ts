import { TestBed } from '@angular/core/testing';
import { SkeletonLoaderComponent } from './skeleton-loader.component';

describe('SkeletonLoaderComponent', () => {
  const setup = () => {
    TestBed.configureTestingModule({ imports: [SkeletonLoaderComponent] });
    const fixture = TestBed.createComponent(SkeletonLoaderComponent);
    fixture.detectChanges();
    return fixture;
  };

  it('debe aplicar las dimensiones por defecto', () => {
    const fixture = setup();
    const host = fixture.nativeElement as HTMLElement;
    const block = host.querySelector('div') as HTMLDivElement;

    expect(block.style.width).toBe('100%');
    expect(block.style.height).toBe('20px');
  });

  it('debe aplicar dimensiones y clase personalizadas', () => {
    const fixture = setup();
    fixture.componentRef.setInput('width', '60%');
    fixture.componentRef.setInput('height', '28px');
    fixture.componentRef.setInput('customClass', 'rounded-md');
    fixture.detectChanges();

    const block = (fixture.nativeElement as HTMLElement).querySelector('div') as HTMLDivElement;
    expect(block.style.width).toBe('60%');
    expect(block.style.height).toBe('28px');
    expect(block.classList.contains('rounded-md')).toBe(true);
  });
});
