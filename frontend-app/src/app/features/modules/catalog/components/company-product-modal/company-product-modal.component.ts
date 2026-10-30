import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FocusTrapDirective } from '../../../../../shared/directives/focus-trap.directive';
import {
  COMPANY_PRODUCT_CONTENT_UNITS,
  COMPANY_PRODUCT_PURCHASE_UNITS,
  COMPANY_PRODUCT_UNITS,
  type CompanyCatalogFieldType,
  type CompanyCatalogFormValue,
  type CompanyCatalogKind,
  type CompanyCatalogModalMode,
  type CompanyCatalogRow,
  type CompanyCatalogStatus,
  COMPANY_SERVICE_MAX_DURATION_MINUTES,
} from '../../../../applications/empresas/public-api';

/**
 * Modal de alta/edición de productos y servicios (ADR-55). Componente
 * presentacional: recibe la fila a editar y emite el payload; no conoce stores.
 */
@Component({
  selector: 'app-company-product-modal',
  standalone: true,
  imports: [ReactiveFormsModule, FocusTrapDirective],
  templateUrl: './company-product-modal.component.html',
})
export class CompanyProductModalComponent {
  readonly open = input(false);
  readonly mode = input<CompanyCatalogModalMode>('create');
  readonly initialType = input<CompanyCatalogKind>('producto');
  readonly item = input<CompanyCatalogRow | null>(null);
  readonly brands = input<readonly string[]>([]);
  readonly saving = input(false);
  readonly error = input<string | null>(null);

  readonly save = output<CompanyCatalogFormValue>();
  readonly dismiss = output<void>();

  private readonly fb = inject(FormBuilder);

  readonly type = signal<CompanyCatalogKind>('producto');
  readonly isEdit = computed(() => this.mode() === 'edit');
  readonly isService = computed(() => this.type() === 'servicio');
  readonly productUnits = COMPANY_PRODUCT_UNITS;
  readonly purchaseUnits = COMPANY_PRODUCT_PURCHASE_UNITS;
  readonly contentUnits = COMPANY_PRODUCT_CONTENT_UNITS;
  readonly brandOptions = computed(() => {
    const options = new Set(this.brands());
    const current = this.form.controls.brand.value.trim();
    if (current) options.add(current);
    return [...options].sort((a, b) => a.localeCompare(b, 'es'));
  });

  readonly form = this.fb.nonNullable.group({
    type: ['producto' as CompanyCatalogKind, [Validators.required]],
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
    description: ['', [Validators.maxLength(500)]],
    category: ['', [Validators.maxLength(80)]],
    code: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9-]{2,32}$/)]],
    brand: ['', [Validators.maxLength(80)]],
    barcode: ['', [Validators.maxLength(64)]],
    cost: ['0.00', [Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
    price: ['', [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
    unit: ['Unidad (u)'],
    allowFractions: [false],
    purchaseUnit: ['Igual que la de venta'],
    contentAmount: [0, [Validators.min(0)]],
    contentUnit: ['Sin contenido'],
    priceType: ['fijo' as CompanyCatalogFieldType],
    costType: ['fijo' as CompanyCatalogFieldType],
    stock: [0, [Validators.min(0)]],
    minStock: [0, [Validators.min(0)]],
    maxStock: ['', [Validators.pattern(/^\d*$/)]],
    warrantyMonths: ['', [Validators.pattern(/^\d*$/)]],
    isRawMaterial: [false],
    location: ['', [Validators.maxLength(120)]],
    status: ['activo' as CompanyCatalogStatus],
    createdAt: ['', [Validators.required]],
    durationMinutes: [
      60,
      [
        Validators.required,
        Validators.min(1),
        Validators.max(COMPANY_SERVICE_MAX_DURATION_MINUTES),
      ],
    ],
  });

  /** Reinicia el formulario al abrirse o cambiar la fila editada. */
  private readonly syncForm = effect(() => {
    if (!this.open()) return;
    const item = this.item();
    const type = item?.kind ?? this.initialType();
    this.type.set(type);
    this.form.reset(item ? this.fromRow(item) : this.emptyForm(type));
    if (item) this.form.controls.code.disable();
    else this.form.controls.code.enable();
  });

  /** En modo edición el tipo no se migra para no romper el registro. */
  setType(type: CompanyCatalogKind): void {
    if (this.isEdit() && this.type() !== type) return;
    this.type.set(type);
    this.form.controls.type.setValue(type);
    if (type === 'servicio' && this.form.controls.unit.value === 'Unidad (u)') {
      this.form.controls.unit.setValue('Hora (h)');
    }
    if (type === 'producto' && this.form.controls.unit.value === 'Hora (h)') {
      this.form.controls.unit.setValue('Unidad (u)');
    }
  }

  setPriceType(type: CompanyCatalogFieldType): void {
    this.form.controls.priceType.setValue(type);
  }

  setCostType(type: CompanyCatalogFieldType): void {
    this.form.controls.costType.setValue(type);
  }

  close(): void {
    if (this.saving()) return;
    this.dismiss.emit();
  }

  submitForm(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    this.save.emit({
      type: raw.type,
      name: raw.name.trim(),
      description: raw.description.trim(),
      category: raw.category.trim(),
      code: raw.code.trim(),
      brand: raw.brand.trim(),
      barcode: raw.barcode.trim(),
      cost: raw.cost.trim(),
      price: raw.price.trim(),
      unit: raw.unit,
      allowFractions: raw.allowFractions,
      purchaseUnit: raw.purchaseUnit,
      contentAmount: Number(raw.contentAmount),
      contentUnit: raw.contentUnit,
      priceType: raw.priceType,
      costType: raw.costType,
      stock: Number(raw.stock),
      minStock: Number(raw.minStock),
      maxStock: raw.maxStock.trim() ? Number(raw.maxStock) : null,
      warrantyMonths: raw.warrantyMonths.trim() ? Number(raw.warrantyMonths) : null,
      isRawMaterial: raw.isRawMaterial,
      location: raw.location.trim(),
      status: raw.status,
      createdAt: raw.createdAt,
      durationMinutes: Number(raw.durationMinutes),
    });
  }

  isInvalid(
    field:
      | 'name'
      | 'description'
      | 'category'
      | 'code'
      | 'brand'
      | 'barcode'
      | 'cost'
      | 'price'
      | 'contentAmount'
      | 'stock'
      | 'minStock'
      | 'maxStock'
      | 'warrantyMonths'
      | 'location'
      | 'createdAt'
      | 'durationMinutes',
  ): boolean {
    const control = this.form.controls[field];
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  private emptyForm(type: CompanyCatalogKind) {
    return {
      type,
      name: '',
      description: '',
      category: '',
      code: '',
      brand: '',
      barcode: '',
      cost: '0.00',
      price: '',
      unit: type === 'servicio' ? 'Hora (h)' : 'Unidad (u)',
      allowFractions: false,
      purchaseUnit: 'Igual que la de venta',
      contentAmount: 0,
      contentUnit: 'Sin contenido',
      priceType: 'fijo' as CompanyCatalogFieldType,
      costType: 'fijo' as CompanyCatalogFieldType,
      stock: 0,
      minStock: 0,
      maxStock: '',
      warrantyMonths: '',
      isRawMaterial: false,
      location: '',
      status: 'activo' as CompanyCatalogStatus,
      createdAt: new Date().toISOString().slice(0, 10),
      durationMinutes: 60,
    };
  }

  private fromRow(row: CompanyCatalogRow) {
    return {
      type: row.kind,
      name: row.name,
      description: row.description,
      category: row.category,
      code: row.code,
      brand: row.brand,
      barcode: row.barcode,
      cost: row.cost === null ? '' : row.cost.toFixed(2),
      price: row.price.toFixed(2),
      unit: row.unit,
      allowFractions: row.allowFractions,
      purchaseUnit: row.purchaseUnit,
      contentAmount: row.contentAmount,
      contentUnit: row.contentUnit,
      priceType: row.priceType,
      costType: row.costType,
      stock: row.stock ?? 0,
      minStock: row.minStock,
      maxStock: row.maxStock === null ? '' : String(row.maxStock),
      warrantyMonths: row.warrantyMonths === null ? '' : String(row.warrantyMonths),
      isRawMaterial: row.isRawMaterial,
      location: row.location,
      status: row.status,
      createdAt: row.createdAt.slice(0, 10),
      durationMinutes: row.durationMinutes ?? 60,
    };
  }
}
