import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FocusTrapDirective } from '../../../../../shared/directives/focus-trap.directive';
import {
  DEFAULT_PURCHASE_DOCUMENT_SETTINGS,
  PURCHASE_LOGO_HEIGHT,
  PURCHASE_LOGO_SIZES,
  type PurchaseDocumentSettings,
  type PurchaseLogoSize,
} from '../../../../domains/purchases/public-api';

/** Panel de personalización de órdenes y reportes en PDF. */
@Component({
  selector: 'app-purchase-customize-modal',
  standalone: true,
  imports: [ReactiveFormsModule, FocusTrapDirective],
  templateUrl: './purchase-customize-modal.component.html',
})
export class PurchaseCustomizeModalComponent {
  readonly open = input.required<boolean>();
  readonly settings = input.required<PurchaseDocumentSettings>();
  readonly companyName = input.required<string>();

  readonly dismiss = output<void>();
  readonly save = output<PurchaseDocumentSettings>();

  private readonly fb = inject(FormBuilder);

  readonly logoOptions = PURCHASE_LOGO_SIZES;
  readonly preview = signal<PurchaseDocumentSettings>({
    ...DEFAULT_PURCHASE_DOCUMENT_SETTINGS,
  });
  readonly canSave = signal(true);

  readonly logoHeight = computed(() => PURCHASE_LOGO_HEIGHT[this.preview().logoSize]);
  readonly tableColor = computed(() =>
    this.preview().matchTableColor ? this.preview().headerColor : '#1f2937',
  );

  readonly form = this.fb.nonNullable.group({
    logoSize: [DEFAULT_PURCHASE_DOCUMENT_SETTINGS.logoSize as PurchaseLogoSize],
    headerColor: [
      DEFAULT_PURCHASE_DOCUMENT_SETTINGS.headerColor,
      [Validators.required, Validators.pattern(/^#[0-9a-fA-F]{6}$/)],
    ],
    matchTableColor: [DEFAULT_PURCHASE_DOCUMENT_SETTINGS.matchTableColor],
    footerMessage: [DEFAULT_PURCHASE_DOCUMENT_SETTINGS.footerMessage, Validators.maxLength(240)],
    showRuc: [DEFAULT_PURCHASE_DOCUMENT_SETTINGS.showRuc],
    showAddress: [DEFAULT_PURCHASE_DOCUMENT_SETTINGS.showAddress],
    showPhone: [DEFAULT_PURCHASE_DOCUMENT_SETTINGS.showPhone],
  });

  private readonly syncPreview = this.form.valueChanges
    .pipe(takeUntilDestroyed())
    .subscribe((value) => {
      const settings = this.toSettings(this.normalizeFormValue(value));
      this.preview.set(settings);
      this.canSave.set(this.form.valid);
    });

  private readonly resetOnOpen = effect(() => {
    if (!this.open()) return;
    const settings = this.settings();
    this.form.reset(settings);
    this.preview.set(settings);
    this.canSave.set(this.form.valid);
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.save.emit(this.toSettings(this.form.getRawValue()));
  }

  private normalizeFormValue(value: {
    logoSize?: PurchaseLogoSize;
    headerColor?: string;
    matchTableColor?: boolean;
    footerMessage?: string;
    showRuc?: boolean;
    showAddress?: boolean;
    showPhone?: boolean;
  }): {
    logoSize: PurchaseLogoSize;
    headerColor: string;
    matchTableColor: boolean;
    footerMessage: string;
    showRuc: boolean;
    showAddress: boolean;
    showPhone: boolean;
  } {
    return {
      logoSize: value.logoSize ?? DEFAULT_PURCHASE_DOCUMENT_SETTINGS.logoSize,
      headerColor: value.headerColor ?? DEFAULT_PURCHASE_DOCUMENT_SETTINGS.headerColor,
      matchTableColor: value.matchTableColor ?? DEFAULT_PURCHASE_DOCUMENT_SETTINGS.matchTableColor,
      footerMessage: value.footerMessage ?? DEFAULT_PURCHASE_DOCUMENT_SETTINGS.footerMessage,
      showRuc: value.showRuc ?? DEFAULT_PURCHASE_DOCUMENT_SETTINGS.showRuc,
      showAddress: value.showAddress ?? DEFAULT_PURCHASE_DOCUMENT_SETTINGS.showAddress,
      showPhone: value.showPhone ?? DEFAULT_PURCHASE_DOCUMENT_SETTINGS.showPhone,
    };
  }

  private toSettings(value: {
    logoSize: PurchaseLogoSize;
    headerColor: string;
    matchTableColor: boolean;
    footerMessage: string;
    showRuc: boolean;
    showAddress: boolean;
    showPhone: boolean;
  }): PurchaseDocumentSettings {
    return {
      logoSize: value.logoSize,
      headerColor: value.headerColor.toUpperCase(),
      matchTableColor: value.matchTableColor,
      footerMessage: value.footerMessage.trim(),
      showRuc: value.showRuc,
      showAddress: value.showAddress,
      showPhone: value.showPhone,
    };
  }
}
