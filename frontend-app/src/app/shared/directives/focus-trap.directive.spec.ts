import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FocusTrapDirective } from './focus-trap.directive';

@Component({
  standalone: true,
  imports: [FocusTrapDirective],
  template: `
    <button id="outside">fuera</button>
    @if (open()) {
      <div [appFocusTrap]="true" (escape)="escaped.set(true)">
        <button id="first">primero</button>
        <button id="last">último</button>
      </div>
    }
  `,
})
class HostComponent {
  readonly open = signal(false);
  readonly escaped = signal(false);
}

describe('FocusTrapDirective', () => {
  let fixture: ComponentFixture<HostComponent>;

  const first = () => document.getElementById('first') as HTMLButtonElement;
  const last = () => document.getElementById('last') as HTMLButtonElement;
  const outside = () => fixture.nativeElement.querySelector('#outside') as HTMLButtonElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.nativeElement.remove();
  });

  it('debe enfocar el primer control y devolver el foco al cerrarse', async () => {
    outside().focus();
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(document.activeElement).toBe(first());

    fixture.componentInstance.open.set(false);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(document.activeElement).toBe(outside());
  });

  it('debe ciclar el foco del último al primero con Tab', async () => {
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    last().focus();
    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    last().dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(first());
  });

  it('debe ciclar el foco del primero al último con Shift+Tab', async () => {
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    first().focus();
    const event = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    });
    first().dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(last());
  });

  it('debe emitir escape cuando se pulsa Escape con el foco atrapado', async () => {
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    first().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(fixture.componentInstance.escaped()).toBe(true);
  });
});
