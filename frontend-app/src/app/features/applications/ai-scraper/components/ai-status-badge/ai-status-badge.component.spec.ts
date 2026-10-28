import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { AiStatusBadgeComponent } from './ai-status-badge.component';

describe('AiStatusBadgeComponent', () => {
  function render(status: string) {
    const fixture = TestBed.createComponent(AiStatusBadgeComponent);
    fixture.componentRef.setInput('status', status);
    fixture.detectChanges();
    return fixture;
  }

  it('debe renderizar el estado con su tono cuando está completado', () => {
    const fixture = render('COMPLETED');
    const el = fixture.nativeElement.querySelector(
      '[data-testid="ai-status-badge"]',
    ) as HTMLElement;
    expect(el.textContent).toContain('COMPLETED');
    expect(el.className).toContain('emerald');
  });

  it('debe usar el tono por defecto cuando el estado es desconocido', () => {
    const fixture = render('RARO');
    const el = fixture.nativeElement.querySelector(
      '[data-testid="ai-status-badge"]',
    ) as HTMLElement;
    expect(el.className).toContain('blue');
  });
});
