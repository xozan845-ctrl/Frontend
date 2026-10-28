import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import LogisticsCompanyOnboardingComponent from './logistics-company-onboarding.component';
import { LogisticsCompanyStore } from '../../state/logistics-company/logistics-company.store';

describe('LogisticsCompanyOnboardingComponent', () => {
  it('envía el nombre y el slug al store', async () => {
    const store = {
      company: () => null,
      saving: () => false,
      error: () => null,
      create: vi.fn(),
    };
    await TestBed.configureTestingModule({
      imports: [LogisticsCompanyOnboardingComponent],
      providers: [provideRouter([]), { provide: LogisticsCompanyStore, useValue: store }],
    }).compileComponents();

    const fixture = TestBed.createComponent(LogisticsCompanyOnboardingComponent);
    fixture.detectChanges();
    fixture.componentInstance.form.setValue({ name: 'Rutas', slug: 'rutas' });
    fixture.componentInstance.submit();

    expect(store.create).toHaveBeenCalledWith({ name: 'Rutas', slug: 'rutas' });
  });
});
