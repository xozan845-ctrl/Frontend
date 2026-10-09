import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AiSessionStore } from '../../state/ai-session.store';
import { SeoService } from '../../../../core/services/seo.service';
import { AiStatusBadgeComponent } from '../../components/ai-status-badge/ai-status-badge.component';
import { AiChatMessageComponent } from '../../components/ai-chat-message/ai-chat-message.component';
import { AiResultsTableComponent } from '../../components/ai-results-table/ai-results-table.component';

/** Parsea headers opcionales (JSON `{ "Authorization": "Bearer x" }`). */
function parseHeaders(raw: string): Record<string, string> | null {
  const value = raw.trim();
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    const out: Record<string, string> = {};
    for (const [key, val] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof val === 'string') out[key] = val;
    }
    return Object.keys(out).length > 0 ? out : null;
  } catch {
    return null;
  }
}

/** Chat de sesiones sobre una URL (`R-AR-1`, contenedor `R-SO-8`). */
@Component({
  selector: 'app-ai-chat',
  imports: [
    ReactiveFormsModule,
    AiStatusBadgeComponent,
    AiChatMessageComponent,
    AiResultsTableComponent,
  ],
  templateUrl: './ai-chat.component.html',
})
export default class AiChatComponent implements OnInit, OnDestroy {
  readonly store = inject(AiSessionStore);
  private readonly fb = inject(FormBuilder);
  private readonly seo = inject(SeoService);

  readonly createForm = this.fb.nonNullable.group({
    url: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+/)]],
    headers: [''],
  });

  readonly messageForm = this.fb.nonNullable.group({
    instruction: ['', [Validators.required, Validators.minLength(2)]],
  });

  constructor() {
    this.seo.setPage('Chat de scraping', 'Conversa con la IA para extraer datos de una web.');
  }

  ngOnInit(): void {
    this.store.loadSessions();
  }

  ngOnDestroy(): void {
    this.seo.reset();
    this.store.clearCurrent();
  }

  createSession(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }
    const { url, headers } = this.createForm.getRawValue();
    const parsed = parseHeaders(headers);
    this.store.createSession({
      url: url.trim(),
      ...(parsed ? { credentials: { headers: parsed } } : {}),
    });
    this.createForm.reset({ url: '', headers: '' });
  }

  open(id: string): void {
    this.store.openSession(id);
  }

  send(): void {
    if (this.messageForm.invalid) {
      this.messageForm.markAllAsTouched();
      return;
    }
    this.store.sendMessage(this.messageForm.getRawValue().instruction.trim());
    this.messageForm.reset({ instruction: '' });
  }
}
