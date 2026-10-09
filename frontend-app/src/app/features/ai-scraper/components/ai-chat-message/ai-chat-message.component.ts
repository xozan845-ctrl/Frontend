import { Component, computed, input } from '@angular/core';
import { AiSessionMessage } from '../../models/ai-session.model';

/** Burbuja de mensaje del chat de sesiones (`R-SO-6`). */
@Component({
  selector: 'app-ai-chat-message',
  templateUrl: './ai-chat-message.component.html',
})
export class AiChatMessageComponent {
  readonly message = input.required<AiSessionMessage>();
  readonly isUser = computed(() => this.message().role === 'user');
}
