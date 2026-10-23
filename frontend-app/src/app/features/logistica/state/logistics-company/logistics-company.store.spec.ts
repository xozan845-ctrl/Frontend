import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AuthStore } from '../../../auth/public-api';
import { NotificationService } from '../../../../core/services/notification/notification.service';
import { LOGISTICS_COMPANY_REPOSITORY } from '../../repositories/logistics-company.repository';
import type { LogisticsCompanyRepository } from '../../repositories/logistics-company.repository';
import { LogisticsCompanyStore } from './logistics-company.store';

describe('LogisticsCompanyStore', () => {
  it('crea la empresa y activa el tenant logístico en la sesión', async () => {
    const repository: LogisticsCompanyRepository = {
      create: vi.fn(() =>
        of({ id: 'log-1', name: 'Rutas', status: 'activa', createdAt: '2026-10-23' }),
      ),
    };
    const setContext = vi.fn();
    const notification = { showSuccess: vi.fn(), showError: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        LogisticsCompanyStore,
        { provide: LOGISTICS_COMPANY_REPOSITORY, useValue: repository },
        {
          provide: AuthStore,
          useValue: { user: () => ({ id: 'u-1' }), setLogisticsCompanyContext: setContext },
        },
        { provide: NotificationService, useValue: notification },
      ],
    });

    const store = TestBed.inject(LogisticsCompanyStore);
    store.create({ name: 'Rutas' });

    await vi.waitFor(() => expect(store.company()?.id).toBe('log-1'));
    expect(setContext).toHaveBeenCalledWith('log-1', 'owner');
    expect(notification.showSuccess).toHaveBeenCalled();
  });

  it('expone el error del repositorio y permite limpiarlo', async () => {
    const repository: LogisticsCompanyRepository = {
      create: vi.fn(() => throwError(() => new Error('No disponible'))),
    };
    const notification = { showSuccess: vi.fn(), showError: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        LogisticsCompanyStore,
        { provide: LOGISTICS_COMPANY_REPOSITORY, useValue: repository },
        { provide: AuthStore, useValue: { user: () => null, setLogisticsCompanyContext: vi.fn() } },
        { provide: NotificationService, useValue: notification },
      ],
    });

    const store = TestBed.inject(LogisticsCompanyStore);
    store.create({ name: 'Rutas' });
    await vi.waitFor(() => expect(store.error()).toBe('No disponible'));
    store.clearError();
    expect(store.error()).toBeNull();
  });
});
