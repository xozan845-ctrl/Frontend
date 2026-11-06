import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

const LEGACY_PREFIXES: readonly (readonly [string, string])[] = [
  ['/empresa', '/app/empresa'],
  ['/vendedor', '/app/tienda'],
  ['/admin', '/app/admin'],
  ['/logistica', '/app/logistica'],
  ['/facturacion', '/app/tienda/facturacion'],
];

/** Traduce una URL antigua de workspace a su ruta canónica `/app/...`. */
export function legacyWorkspaceTarget(url: string): string {
  const path = url.split(/[?#]/)[0];
  const match = LEGACY_PREFIXES.find(([from]) => path === from || path.startsWith(`${from}/`));
  if (!match) return '/app';
  return `${match[1]}${path.slice(match[0].length)}${url.slice(path.length)}`;
}

/** Compatibilidad: redirige las URLs antiguas de workspace a `/app`. */
@Component({
  selector: 'app-legacy-workspace-redirect',
  standalone: true,
  templateUrl: './legacy-workspace-redirect.component.html',
})
export default class LegacyWorkspaceRedirectComponent {
  private readonly router = inject(Router);

  /** Se ejecuta al construir el componente; evita constructor (R-AR-15). */
  private readonly redirect = this.router.navigateByUrl(legacyWorkspaceTarget(this.router.url), {
    replaceUrl: true,
  });
}
