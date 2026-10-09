import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AiRadiographyComponent from './ai-radiography.component';
import { AiRadiographyStore } from '../../state/ai-radiography.store';

function storeFake() {
  return {
    running: signal(false),
    result: signal<unknown>(null),
    error: signal<string | null>(null),
    profile: signal<unknown>(null),
    profileLoading: signal(false),
    run: vi.fn(),
    loadProfile: vi.fn(),
  };
}

describe('AiRadiographyComponent', () => {
  let store: ReturnType<typeof storeFake>;

  beforeEach(() => {
    store = storeFake();
    TestBed.configureTestingModule({
      imports: [AiRadiographyComponent],
      providers: [{ provide: AiRadiographyStore, useValue: store }],
    });
  });

  it('debe lanzar la radiografía con los datos del formulario', () => {
    const fixture = TestBed.createComponent(AiRadiographyComponent);
    fixture.detectChanges();
    fixture.componentInstance.form.setValue({ url: 'https://x.test', maxPages: 5, maxDepth: 2 });
    fixture.componentInstance.run();
    expect(store.run).toHaveBeenCalledWith({ url: 'https://x.test', maxPages: 5, maxDepth: 2 });
  });

  it('no debe lanzar la radiografía con el formulario inválido', () => {
    const fixture = TestBed.createComponent(AiRadiographyComponent);
    fixture.detectChanges();
    fixture.componentInstance.run();
    expect(store.run).not.toHaveBeenCalled();
  });

  it('debe consultar el perfil aprendido del dominio', () => {
    const fixture = TestBed.createComponent(AiRadiographyComponent);
    fixture.detectChanges();
    fixture.componentInstance.profileForm.setValue({ domain: 'x.test' });
    fixture.componentInstance.loadProfile();
    expect(store.loadProfile).toHaveBeenCalledWith('x.test');
  });
});
