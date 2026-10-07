import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { EmptyStateComponent } from './empty-state.component';

describe('EmptyStateComponent', () => {
  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [EmptyStateComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(EmptyStateComponent);
    return fixture;
  };

  it('debe mostrar título y subtítulo', async () => {
    const fixture = await setup();
    fixture.componentRef.setInput('title', 'Sin Resultados');
    fixture.componentRef.setInput('subtitle', 'No hay nada aquí');
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Sin Resultados');
    expect(text).toContain('No hay nada aquí');
  });

  it('debe renderizar un enlace cuando hay ruta de acción', async () => {
    const fixture = await setup();
    fixture.componentRef.setInput('actionLabel', 'Ir a la tienda');
    fixture.componentRef.setInput('actionRoute', '/shop');
    fixture.detectChanges();

    const link = (fixture.nativeElement as HTMLElement).querySelector('a');
    expect(link?.textContent).toContain('Ir a la tienda');
  });

  it('debe emitir la acción al pulsar el botón', async () => {
    const fixture = await setup();
    const onClick = vi.fn();
    fixture.componentRef.setInput('actionLabel', 'Reintentar');
    fixture.componentRef.setInput('actionClick', onClick);
    fixture.detectChanges();

    const button = (fixture.nativeElement as HTMLElement).querySelector(
      'button',
    ) as HTMLButtonElement;
    button.click();

    expect(onClick).toHaveBeenCalledOnce();
  });

  it('debe mostrar un spinner en la variante de carga', async () => {
    const fixture = await setup();
    fixture.componentRef.setInput('variant', 'loading');
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('app-spinner')).not.toBeNull();
  });
});
