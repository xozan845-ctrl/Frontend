import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CartFlyService {
  /**
   * Animates a product image flying from sourceEl to the cart icon in the navbar.
   * Uses Web Animations API for smooth, performant animation.
   */
  fly(sourceEl: HTMLElement, imageUrl: string): void {
    const cartTarget = document.querySelector<HTMLElement>('[data-cart-fly-target]');
    if (!cartTarget) return;

    const sourceRect = sourceEl.getBoundingClientRect();
    const targetRect = cartTarget.getBoundingClientRect();

    // Create the flying clone element
    const clone = document.createElement('img');
    clone.src = imageUrl;
    clone.setAttribute('aria-hidden', 'true');
    clone.style.cssText = `
      position: fixed;
      z-index: 9999;
      pointer-events: none;
      border-radius: 50%;
      object-fit: cover;
      width: 56px;
      height: 56px;
      top: ${sourceRect.top + sourceRect.height / 2 - 28}px;
      left: ${sourceRect.left + sourceRect.width / 2 - 28}px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.2);
    `;
    document.body.appendChild(clone);

    // Calculate delta to cart icon center
    const targetCenterX = targetRect.left + targetRect.width / 2;
    const targetCenterY = targetRect.top + targetRect.height / 2;
    const sourceCenterX = sourceRect.left + sourceRect.width / 2;
    const sourceCenterY = sourceRect.top + sourceRect.height / 2;

    const deltaX = targetCenterX - sourceCenterX;
    const deltaY = targetCenterY - sourceCenterY;

    const animation = clone.animate(
      [
        { transform: 'translate(0, 0) scale(1)', opacity: 1 },
        {
          transform: `translate(${deltaX * 0.6}px, ${deltaY * 0.3}px) scale(0.7)`,
          opacity: 0.8,
          offset: 0.5,
        },
        { transform: `translate(${deltaX}px, ${deltaY}px) scale(0.1)`, opacity: 0 },
      ],
      {
        duration: 650,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        fill: 'forwards',
      },
    );

    animation.onfinish = () => clone.remove();
    animation.oncancel = () => clone.remove();
  }
}
