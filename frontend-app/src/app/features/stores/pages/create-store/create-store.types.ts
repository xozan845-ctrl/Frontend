import type { FormControl, FormGroup } from '@angular/forms';

export type ProductRow = FormGroup<{
  productId: FormControl<string>;
  selected: FormControl<boolean>;
  margin: FormControl<number>;
}>;
