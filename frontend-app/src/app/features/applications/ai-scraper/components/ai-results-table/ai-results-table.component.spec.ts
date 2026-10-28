import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { AiResultsTableComponent } from './ai-results-table.component';

describe('AiResultsTableComponent', () => {
  it('debe derivar las columnas de los items y mostrar el origen', () => {
    const fixture = TestBed.createComponent(AiResultsTableComponent);
    fixture.componentRef.setInput('items', [
      { name: 'Laptop', price: 10, _source: { url: 'https://x.test/p' } },
    ]);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('name');
    expect(text).toContain('Laptop');
    expect(text).toContain('https://x.test/p');
  });

  it('debe mostrar el estado vacío cuando no hay items', () => {
    const fixture = TestBed.createComponent(AiResultsTableComponent);
    fixture.componentRef.setInput('items', []);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-testid="ai-results-empty"]')).not.toBeNull();
  });
});
