import { TestBed } from '@angular/core/testing';
import CompanyCatalogDeleteDialogsComponent from './company-catalog-delete-dialogs.component';

describe('CompanyCatalogDeleteDialogsComponent', () => {
  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [CompanyCatalogDeleteDialogsComponent],
    }).compileComponents();
    return TestBed.createComponent(CompanyCatalogDeleteDialogsComponent);
  };

  it('emite la confirmación y la cancelación del servicio', async () => {
    const fixture = await setup();
    fixture.componentRef.setInput('service', { id: 's-1', name: 'Instalación' });
    fixture.detectChanges();
    const confirmed: string[] = [];
    const cancelled: string[] = [];
    fixture.componentInstance.confirmed.subscribe((kind) => confirmed.push(kind));
    fixture.componentInstance.cancelled.subscribe((kind) => cancelled.push(kind));

    const host = fixture.nativeElement as HTMLElement;
    host.querySelector<HTMLButtonElement>('[data-testid="confirm-delete-service"]')?.click();
    host.querySelector<HTMLButtonElement>('[data-testid="cancel-delete-service"]')?.click();

    expect(confirmed).toEqual(['service']);
    expect(cancelled).toEqual(['service']);
  });
});
