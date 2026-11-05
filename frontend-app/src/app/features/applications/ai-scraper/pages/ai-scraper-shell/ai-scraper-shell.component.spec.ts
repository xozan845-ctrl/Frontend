import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';
import AiScraperShellComponent from './ai-scraper-shell.component';

describe('AiScraperShellComponent', () => {
  it('debe renderizar la marca, la navegación y el outlet del módulo', async () => {
    await TestBed.configureTestingModule({
      imports: [AiScraperShellComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(AiScraperShellComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="ai-scraper-home"]')).not.toBeNull();
    expect(
      fixture.nativeElement.querySelector('[data-testid="ai-scraper-nav-chat"]'),
    ).not.toBeNull();
    expect(fixture.nativeElement.querySelector('router-outlet')).not.toBeNull();
  });
});
