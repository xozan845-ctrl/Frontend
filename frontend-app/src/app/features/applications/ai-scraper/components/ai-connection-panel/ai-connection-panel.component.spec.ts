import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { AiConnectionPanelComponent } from './ai-connection-panel.component';

describe('AiConnectionPanelComponent', () => {
  function render() {
    const fixture = TestBed.createComponent(AiConnectionPanelComponent);
    fixture.componentRef.setInput('endpoint', 'http://localhost:3000/api/v1');
    fixture.componentRef.setInput('hasKey', false);
    fixture.detectChanges();
    return fixture;
  }

  it('debe emitir la API key al guardar', () => {
    const fixture = render();
    let saved = '';
    fixture.componentInstance.save.subscribe((value) => (saved = value));

    const input = fixture.nativeElement.querySelector(
      '[data-testid="ai-api-key-input"]',
    ) as HTMLInputElement;
    input.value = 'secret';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    expect(saved).toBe('secret');
  });

  it('debe emitir clear cuando ya hay una clave', () => {
    const fixture = TestBed.createComponent(AiConnectionPanelComponent);
    fixture.componentRef.setInput('endpoint', 'http://localhost:3000/api/v1');
    fixture.componentRef.setInput('hasKey', true);
    fixture.detectChanges();

    let cleared = false;
    fixture.componentInstance.clear.subscribe(() => (cleared = true));
    (
      fixture.nativeElement.querySelector('[data-testid="ai-api-key-clear"]') as HTMLButtonElement
    ).click();
    expect(cleared).toBe(true);
  });
});
