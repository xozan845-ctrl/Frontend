import { Component, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

/** Campos de estado y fecha de creación del producto/servicio. */
@Component({
  selector: 'app-company-product-status-fields',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './company-product-status-fields.component.html',
})
export default class CompanyProductStatusFieldsComponent {
  readonly form = input.required<FormGroup>();
}
