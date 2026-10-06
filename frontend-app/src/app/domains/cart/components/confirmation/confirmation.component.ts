import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-confirmation',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './confirmation.component.html',
  styles: [],
})
export class ConfirmationComponent {
  readonly orderNumber = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
}
export default ConfirmationComponent;
