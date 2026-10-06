import { Injectable, inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  private readonly defaultTitle = 'Quantum Store — Hardware Premium';
  private readonly defaultDescription =
    'Selección editorial de tecnología de alto rendimiento. Hardware sin concesiones para profesionales exigentes.';

  updateTitle(pageTitle?: string): void {
    this.title.setTitle(pageTitle ? `${pageTitle} | Quantum Store` : this.defaultTitle);
  }

  updateMeta(description?: string): void {
    this.meta.updateTag({ name: 'description', content: description || this.defaultDescription });
  }

  setProductPage(name: string, description: string, price: number): void {
    this.updateTitle(name);
    this.updateMeta(`${description.slice(0, 150)} — Desde $${price.toFixed(2)}`);
    this.meta.updateTag({ property: 'og:title', content: `${name} | Quantum Store` });
    this.meta.updateTag({ property: 'og:description', content: description.slice(0, 200) });
    this.meta.updateTag({ property: 'og:type', content: 'product' });
  }

  setPage(title: string, description?: string): void {
    this.updateTitle(title);
    this.updateMeta(description);
  }

  reset(): void {
    this.updateTitle();
    this.updateMeta();
  }
}
