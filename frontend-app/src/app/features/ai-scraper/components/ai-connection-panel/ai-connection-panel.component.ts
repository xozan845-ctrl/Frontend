import { Component, input, output, signal } from '@angular/core';

/** Panel de conexión: endpoint + API key en runtime (`R-SO-6`, `R-SE-2`). */
@Component({
  selector: 'app-ai-connection-panel',
  templateUrl: './ai-connection-panel.component.html',
})
export class AiConnectionPanelComponent {
  readonly endpoint = input.required<string>();
  readonly hasKey = input(false);

  readonly save = output<string>();
  readonly clear = output<void>();

  readonly key = signal('');

  onInput(event: Event): void {
    this.key.set((event.target as HTMLInputElement).value);
  }

  onSubmit(): void {
    const value = this.key().trim();
    if (!value) return;
    this.save.emit(value);
    this.key.set('');
  }
}
