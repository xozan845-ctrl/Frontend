import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { CURRENCY, formatCurrency } from '../config/currency.config';
import { COMPANY_INFO } from '../constants/company.constants';
import type { ProductSeoExtras } from '../models/seo.model';

const SITE_NAME = COMPANY_INFO.name;
const DEFAULT_TITLE = `${SITE_NAME} — Hardware Premium`;
const DEFAULT_DESCRIPTION =
  'Selección editorial de tecnología de alto rendimiento. Hardware sin concesiones para profesionales exigentes.';
const DEFAULT_OG_IMAGE = '/og-image.png';

/** Etiquetas sociales que gestiona el servicio y hay que limpiar al salir. */
const OPEN_GRAPH_TAGS = [
  'og:title',
  'og:description',
  'og:type',
  'og:url',
  'og:site_name',
  'og:image',
  'og:image:alt',
];

const TWITTER_TAGS = ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image'];

/**
 * Servicio transversal de SEO dinámico (`R-UX-6`): centraliza el `<title>`, las
 * `<meta>`, el canonical, Open Graph/Twitter y los datos estructurados de cada
 * página para no repetir metadatos en cada componente.
 *
 * `providedIn: 'root'` → instancia única y *tree-shakeable* si nadie lo inyecta.
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly doc = inject(DOCUMENT);

  private readonly structuredDataId = 'seo-product-jsonld';

  /** Aplica el patrón "Página | Marca" (lo específico primero, mejor para SEO). */
  updateTitle(pageTitle?: string): void {
    this.title.setTitle(pageTitle ? `${pageTitle} | ${SITE_NAME}` : DEFAULT_TITLE);
  }

  /**
   * Actualiza `name="description"`. Se usa `||` (no `??`) a propósito: un
   * string vacío también debe caer al valor por defecto.
   */
  updateMeta(description?: string): void {
    this.meta.updateTag({ name: 'description', content: description || DEFAULT_DESCRIPTION });
  }

  /**
   * SEO completo de una ficha de producto: título, descripción con precio,
   * canonical, Open Graph/Twitter y datos estructurados `Product` (JSON-LD).
   */
  setProductPage(
    name: string,
    description: string,
    price: number,
    extras: ProductSeoExtras = {},
  ): void {
    const canonical = this.absoluteUrl(this.currentPath());
    const socialDescription = description.slice(0, 200);
    const image = extras.imageUrl ? this.absoluteUrl(extras.imageUrl, canonical) : undefined;

    this.updateTitle(name);
    this.updateMeta(`${description.slice(0, 150)} — Desde ${formatCurrency(price)}`);
    this.setCanonical(canonical);
    this.clearSocialTags();

    this.meta.updateTag({ property: 'og:title', content: `${name} | ${SITE_NAME}` });
    this.meta.updateTag({ property: 'og:description', content: socialDescription });
    this.meta.updateTag({ property: 'og:type', content: 'product' });
    this.meta.updateTag({ property: 'og:url', content: canonical });
    this.meta.updateTag({ property: 'og:site_name', content: SITE_NAME });

    if (image) {
      this.meta.updateTag({ property: 'og:image', content: image });
      this.meta.updateTag({ property: 'og:image:alt', content: name });
    }

    this.meta.updateTag({
      name: 'twitter:card',
      content: image ? 'summary_large_image' : 'summary',
    });
    this.meta.updateTag({ name: 'twitter:title', content: `${name} | ${SITE_NAME}` });
    this.meta.updateTag({ name: 'twitter:description', content: socialDescription });
    if (image) this.meta.updateTag({ name: 'twitter:image', content: image });

    this.setProductStructuredData({
      name,
      description,
      price,
      url: canonical,
      image,
      inStock: extras.inStock ?? true,
    });
  }

  /** Título, descripción, canonical y Open Graph de una página genérica. */
  setPage(title: string, description?: string, path?: string): void {
    const canonical = this.absoluteUrl(path ?? this.currentPath());
    const socialDescription = description || DEFAULT_DESCRIPTION;
    const image = this.absoluteUrl(DEFAULT_OG_IMAGE);

    this.updateTitle(title);
    this.updateMeta(description);
    this.setCanonical(canonical);
    this.clearSocialTags();
    this.removeStructuredData();

    this.meta.updateTag({ property: 'og:title', content: `${title} | ${SITE_NAME}` });
    this.meta.updateTag({ property: 'og:description', content: socialDescription });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:url', content: canonical });
    this.meta.updateTag({ property: 'og:site_name', content: SITE_NAME });
    this.meta.updateTag({ property: 'og:image', content: image });
    this.meta.updateTag({ property: 'og:image:alt', content: `${title} | ${SITE_NAME}` });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: `${title} | ${SITE_NAME}` });
    this.meta.updateTag({ name: 'twitter:description', content: socialDescription });
    this.meta.updateTag({ name: 'twitter:image', content: image });
  }

  /** Restaura los metadatos por defecto (p. ej. en `ngOnDestroy` al salir). */
  reset(): void {
    this.updateTitle();
    this.updateMeta();
    this.clearSocialTags();
    this.setDefaultSocialTags();
    this.removeStructuredData();
    this.removeCanonical();
  }

  private setCanonical(href: string): void {
    let link = this.doc.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.doc.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.doc.head.appendChild(link);
    }
    link.setAttribute('href', href);
  }

  private removeCanonical(): void {
    this.doc.head.querySelector('link[rel="canonical"]')?.remove();
  }

  private clearSocialTags(): void {
    for (const property of OPEN_GRAPH_TAGS) {
      this.meta.removeTag(`property="${property}"`);
    }
    for (const name of TWITTER_TAGS) {
      this.meta.removeTag(`name="${name}"`);
    }
  }

  /** Estado social equivalente al de `index.html` mientras no hay página activa. */
  private setDefaultSocialTags(): void {
    const image = this.absoluteUrl(DEFAULT_OG_IMAGE);
    this.meta.updateTag({ property: 'og:title', content: DEFAULT_TITLE });
    this.meta.updateTag({ property: 'og:description', content: DEFAULT_DESCRIPTION });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:site_name', content: SITE_NAME });
    this.meta.updateTag({ property: 'og:image', content: image });
    this.meta.updateTag({ property: 'og:image:alt', content: DEFAULT_TITLE });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: DEFAULT_TITLE });
    this.meta.updateTag({ name: 'twitter:description', content: DEFAULT_DESCRIPTION });
    this.meta.updateTag({ name: 'twitter:image', content: image });
  }

  private setProductStructuredData(product: {
    name: string;
    description: string;
    price: number;
    url: string;
    image?: string;
    inStock: boolean;
  }): void {
    let script = this.doc.getElementById(this.structuredDataId) as HTMLScriptElement | null;
    if (!script) {
      script = this.doc.createElement('script');
      script.id = this.structuredDataId;
      script.type = 'application/ld+json';
      this.doc.head.appendChild(script);
    }

    const data = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.description,
      ...(product.image ? { image: [product.image] } : {}),
      brand: { '@type': 'Brand', name: SITE_NAME },
      offers: {
        '@type': 'Offer',
        url: product.url,
        price: product.price,
        priceCurrency: CURRENCY.code,
        availability: product.inStock
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      },
    };

    // `</script>` dentro del JSON rompería el bloque: se escapa `<`.
    script.textContent = JSON.stringify(data).replace(/</g, '\\u003c');
  }

  private removeStructuredData(): void {
    this.doc.getElementById(this.structuredDataId)?.remove();
  }

  /** Ruta actual sin query ni hash: evita canonicalizar parámetros de tracking. */
  private currentPath(): string {
    return this.doc.location.pathname;
  }

  private absoluteUrl(value: string, base: string = this.doc.location.origin): string {
    try {
      return new URL(value, base).href;
    } catch {
      return value;
    }
  }
}
