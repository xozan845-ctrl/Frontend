import { Component, HostListener, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CompanySidebarComponent } from '../../components/company-sidebar/company-sidebar.component';

/** Shell aislado del workspace del propietario de empresa. */
@Component({
  selector: 'app-company-shell',
  standalone: true,
  imports: [RouterOutlet, CompanySidebarComponent],
  templateUrl: './company-shell.component.html',
})
export default class CompanyShellComponent {
  readonly isSidebarOpen = signal(false);

  @HostListener('document:keydown.escape')
  closeSidebar(): void {
    this.isSidebarOpen.set(false);
  }
}
