import type { AiSession } from '../../models/ai-session.model';

/** Sugerencia del estado vacío: rellena la URL con un sitio público de práctica. */
export interface ChatSuggestion {
  id: string;
  icon: string;
  title: string;
  description: string;
  url: string;
}

/** Grupo del historial por antigüedad. */
export interface SessionGroup {
  label: string;
  items: AiSession[];
}
