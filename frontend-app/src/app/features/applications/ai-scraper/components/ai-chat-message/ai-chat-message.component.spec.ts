import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { AiChatMessageComponent } from './ai-chat-message.component';
import { AiSessionMessage } from '../../models/ai-session.model';

describe('AiChatMessageComponent', () => {
  function render(message: AiSessionMessage) {
    const fixture = TestBed.createComponent(AiChatMessageComponent);
    fixture.componentRef.setInput('message', message);
    fixture.detectChanges();
    return fixture;
  }

  it('debe alinear a la derecha un mensaje del usuario', () => {
    const fixture = render({
      id: 'm1',
      role: 'user',
      content: 'hola',
      jobId: null,
      jobStatus: null,
      results: null,
    });
    expect(fixture.nativeElement.querySelector('.justify-end')).not.toBeNull();
  });

  it('debe alinear a la izquierda un mensaje del asistente', () => {
    const fixture = render({
      id: 'm2',
      role: 'assistant',
      content: 'listo',
      jobId: null,
      jobStatus: null,
      results: null,
    });
    expect(fixture.nativeElement.querySelector('.justify-start')).not.toBeNull();
  });
});
