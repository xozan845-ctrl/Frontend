import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './layout/navbar/navbar.component';
import { Footer } from './layout/footer/footer.component';
import { CartSidebarComponent } from './features/cart/components/cart-sidebar/cart-sidebar.component';
import { ToastComponent } from './shared/ui/notification/toast.component';
import { PwaInstallBannerComponent } from './shared/ui/pwa-install/pwa-install-banner.component';
import { FloatingSupportComponent } from './shared/ui/floating-support/floating-support.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    Navbar,
    Footer,
    CartSidebarComponent,
    ToastComponent,
    PwaInstallBannerComponent,
    FloatingSupportComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class App {}
