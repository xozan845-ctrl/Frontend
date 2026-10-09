import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { AiRadiographyStore } from './ai-radiography.store';
import { AI_RADIOGRAPHY_REPOSITORY } from '../repositories/ai-radiography.repository';
import { NotificationService } from '../../../core/services/notification.service';

function makeRepo() {
  return { run: vi.fn(), getLearnedProfile: vi.fn() };
}

describe('AiRadiographyStore', () => {
  let store: InstanceType<typeof AiRadiographyStore>;
  let repo: ReturnType<typeof makeRepo>;
  const notification = { showSuccess: vi.fn(), showError: vi.fn(), showInfo: vi.fn() };

  beforeEach(() => {
    repo = makeRepo();
    TestBed.configureTestingModule({
      providers: [
        AiRadiographyStore,
        { provide: AI_RADIOGRAPHY_REPOSITORY, useValue: repo },
        { provide: NotificationService, useValue: notification },
      ],
    });
    store = TestBed.inject(AiRadiographyStore);
  });

  afterEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('debe ejecutar la radiografía y guardar el resultado', () => {
    repo.run.mockReturnValue(
      of({ domain: 'x.test', profileId: 'p', discovered: 7, radiography: {} }),
    );
    store.run({ url: 'https://x.test' });
    expect(store.result()?.discovered).toBe(7);
    expect(store.running()).toBe(false);
  });

  it('debe exponer el error cuando la radiografía falla', () => {
    repo.run.mockReturnValue(throwError(() => new Error('timeout')));
    store.run({ url: 'https://x.test' });
    expect(store.error()).toBe('timeout');
    expect(notification.showError).toHaveBeenCalledWith('timeout');
  });

  it('debe cargar el perfil aprendido de un dominio', () => {
    repo.getLearnedProfile.mockReturnValue(
      of({ shouldUseBrowser: true, recommendedSelectors: { a: 1 }, profile: {} }),
    );
    store.loadProfile('x.test');
    expect(store.profile()?.shouldUseBrowser).toBe(true);
    expect(store.profileLoading()).toBe(false);
  });
});
