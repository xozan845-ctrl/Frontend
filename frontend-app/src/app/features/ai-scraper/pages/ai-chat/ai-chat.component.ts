import { Component, OnDestroy, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AiSessionStore } from '../../state/ai-session/ai-session.store';
import { AiSession } from '../../models/ai-session.model';
import { injectSeoPage } from '../../../../core/services/seo/seo.service';
import { AiStatusBadgeComponent } from '../../components/ai-status-badge/ai-status-badge.component';
import { AiChatMessageComponent } from '../../components/ai-chat-message/ai-chat-message.component';
import { AiResultsTableComponent } from '../../components/ai-results-table/ai-results-table.component';
import { AI_SCRAPER_PRACTICE_SITES } from '../../constants/ai-scraper.constants';
import type { ChatSuggestion, SessionGroup } from './ai-chat.types';

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

const DAY_MS = 24 * 60 * 60 * 1000;

const SUGGESTIONS: readonly ChatSuggestion[] = [
  {
    id: 'catalog',
    icon: 'fa-solid fa-store',
    title: 'Explorar un catálogo',
    description: 'Nombres, precios y disponibilidad.',
    url: AI_SCRAPER_PRACTICE_SITES.catalog,
  },
  {
    id: 'articles',
    icon: 'fa-regular fa-newspaper',
    title: 'Reunir artículos',
    description: 'Titulares, autores y fechas.',
    url: AI_SCRAPER_PRACTICE_SITES.articles,
  },
  {
    id: 'example',
    icon: 'fa-solid fa-flask',
    title: 'Probar con un ejemplo',
    description: 'Un sitio público de práctica.',
    url: AI_SCRAPER_PRACTICE_SITES.example,
  },
];

/** Chat de sesiones sobre una URL (`R-AR-1`, contenedor `R-SO-8`). */
@Component({
  selector: 'app-ai-chat',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AiStatusBadgeComponent,
    AiChatMessageComponent,
    AiResultsTableComponent,
  ],
  templateUrl: './ai-chat.component.html',
})
export default class AiChatComponent implements OnDestroy {
  readonly store = inject(AiSessionStore);
  private readonly fb = inject(FormBuilder);
  private readonly seo = injectSeoPage(
    'Chat de scraping',
    'Conversa con la IA para extraer datos de una web.',
  );

  private readonly loadSessions = this.store.loadSessions();

  readonly suggestions = SUGGESTIONS;

  /** Término de búsqueda del historial. */
  readonly search = signal('');

  readonly createForm = this.fb.nonNullable.group({
    url: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+/)]],
    headers: [''],
  });

  readonly messageForm = this.fb.nonNullable.group({
    instruction: ['', [Validators.required, Validators.minLength(2)]],
  });

  /** Historial filtrado por dominio o URL (buscador lateral). */
  readonly filteredSessions = computed(() => {
    const term = this.search().trim().toLowerCase();
    const sessions = this.store.sessions();
    if (!term) return sessions;
    return sessions.filter((session) =>
      `${session.domain} ${session.url}`.toLowerCase().includes(term),
    );
  });

  /** Historial agrupado en Hoy / Últimos 7 días / Anteriores. */
  readonly sessionGroups = computed<SessionGroup[]>(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayMs = startOfToday.getTime();
    const weekMs = todayMs - 6 * DAY_MS;
    const today: AiSession[] = [];
    const week: AiSession[] = [];
    const older: AiSession[] = [];
    for (const session of this.filteredSessions()) {
      const created = Date.parse(session.createdAt);
      if (Number.isNaN(created) || created < weekMs) older.push(session);
      else if (created >= todayMs) today.push(session);
      else week.push(session);
    }
    return [
      { label: 'Hoy', items: today },
      { label: 'Últimos 7 días', items: week },
      { label: 'Anteriores', items: older },
    ].filter((group) => group.items.length > 0);
  });

  // Habilita/deshabilita la instrucción según el estado del chat gestionando el
  // `FormControl` (no el atributo `disabled`), evitando el warning de Angular
  // al usar `disabled` sobre un control reactivo.
  private readonly syncMessageControl = effect(() => {
    const control = this.messageForm.controls.instruction;
    if (this.store.canSend()) {
      if (control.disabled) control.enable({ emitEvent: false });
    } else if (control.enabled) {
      control.disable({ emitEvent: false });
    }
  });

  ngOnDestroy(): void {
    this.store.clearCurrent();
  }

  /** Filtra el historial mientras se escribe en el buscador. */
  onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  /** Rellena la URL con el ejemplo de una sugerencia. */
  applySuggestion(url: string): void {
    this.createForm.controls.url.setValue(url);
  }

  /** Reinicia la conversación activa y limpia los formularios. */
  newConversation(): void {
    this.store.clearCurrent();
    this.createForm.reset({ url: '', headers: '' });
    this.messageForm.reset({ instruction: '' });
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
    if (!this.store.canSend() || this.messageForm.invalid) {
      this.messageForm.markAllAsTouched();
      return;
    }
    this.store.sendMessage(this.messageForm.getRawValue().instruction.trim());
    this.messageForm.reset({ instruction: '' });
  }
}
