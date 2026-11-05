import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

/**
 * Shell del módulo de scraping con IA (R-UX-7): aporta el fondo ambiental y la
 * barra Glass que comparten el panel, el detalle de job y el chat.
 */
@Component({
  selector: 'app-ai-scraper-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './ai-scraper-shell.component.html',
})
export default class AiScraperShellComponent {}
