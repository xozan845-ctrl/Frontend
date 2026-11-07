import type { FormControl, FormGroup } from '@angular/forms';

export type ProductRow = FormGroup<{
  productId: FormControl<string>;
  selected: FormControl<boolean>;
  margin: FormControl<number>;
}>;

export type NewProductRow = FormGroup<{
  sku: FormControl<string>;
  name: FormControl<string>;
  description: FormControl<string>;
  category: FormControl<string>;
  basePrice: FormControl<string>;
  stock: FormControl<number>;
  margin: FormControl<number>;
}>;
