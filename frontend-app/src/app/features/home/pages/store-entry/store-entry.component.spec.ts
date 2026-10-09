import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import StoreEntryComponent from './store-entry.component';

describe('StoreEntryComponent', () => {
  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [StoreEntryComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(StoreEntryComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe navegar al asistente al pulsar "Crear mi tienda"', async () => {
    const fixture = await setup();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const button = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('button'),
    ).find((candidate) => candidate.textContent?.includes('Crear mi tienda'))!;

    button.click();

    expect(navigate).toHaveBeenCalledWith(['/crear-tienda']);
  });

  it('debe entrar a la tienda indicada', async () => {
    const fixture = await setup();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    fixture.componentInstance.goToStore('t-1');

    expect(navigate).toHaveBeenCalledWith(['/tienda', 't-1', 'shop']);
  });
});
