import { Component, OnDestroy, inject } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AiRadiographyStore } from '../../state/ai-radiography.store';
import { SeoService } from '../../../../core/services/seo.service';

/** Radiografía / memoria de sitios (`R-SO-8`, contenedor). */
@Component({
  selector: 'app-ai-radiography',
  imports: [ReactiveFormsModule, JsonPipe],
  templateUrl: './ai-radiography.component.html',
})
export default class AiRadiographyComponent implements OnDestroy {
  readonly store = inject(AiRadiographyStore);
  private readonly fb = inject(FormBuilder);
  private readonly seo = inject(SeoService);

  readonly form = this.fb.nonNullable.group({
    url: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+/)]],
    maxPages: [10, [Validators.min(1), Validators.max(1000)]],
    maxDepth: [2, [Validators.min(1), Validators.max(10)]],
  });

  readonly profileForm = this.fb.nonNullable.group({
    domain: ['', [Validators.required]],
  });

  constructor() {
    this.seo.setPage('Radiografía de sitios', 'Analiza una web y consulta su perfil aprendido.');
  }

  ngOnDestroy(): void {
    this.seo.reset();
  }

  run(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { url, maxPages, maxDepth } = this.form.getRawValue();
    this.store.run({ url: url.trim(), maxPages, maxDepth });
  }

  loadProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }
    this.store.loadProfile(this.profileForm.getRawValue().domain.trim());
  }
}
