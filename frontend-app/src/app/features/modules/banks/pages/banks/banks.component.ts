import { Component, inject, signal } from '@angular/core';
import { AppCurrencyPipe } from '../../../../../shared/pipes/app-currency.pipe';
import { injectSeoPage } from '../../../../../core/services/seo/seo.service';
import { BANKS_SCOPE_CONFIG } from '../../../../../shared/banks/constants/banks-config.tokens';
import {
  BANK_ACCOUNT_TYPES,
  BanksStore,
  type BankAccount,
  type BankAccountType,
  type CreateBankAccountPayload,
} from '../../../../banks/public-api';
import { BankFormComponent } from '../../components/bank-form/bank-form.component';

/**
 * Bancos compartidos entre empresa y vendedor (ADR-68). El scope inyectado
 * decide el título y el almacenamiento; el saldo total vive en el store.
 */
@Component({
  selector: 'app-banks',
  standalone: true,
  imports: [AppCurrencyPipe, BankFormComponent],
  templateUrl: './banks.component.html',
})
export default class BanksComponent {
  readonly config = inject(BANKS_SCOPE_CONFIG);
  readonly banks = inject(BanksStore);
  readonly editing = signal<BankAccount | null>(null);
  readonly typeLabels: Readonly<Record<BankAccountType, string>> = Object.fromEntries(
    BANK_ACCOUNT_TYPES.map((type) => [type.value, type.label]),
  ) as Record<BankAccountType, string>;

  private readonly seoService = injectSeoPage(
    `${this.config.title} — ${this.config.scope === 'company' ? 'Empresa' : 'Panel del vendedor'}`,
    this.config.subtitle,
  );

  save(payload: CreateBankAccountPayload): void {
    const current = this.editing();
    if (current) this.banks.updateAccount(current.id, payload);
    else this.banks.addAccount(payload);
    this.editing.set(null);
  }

  edit(account: BankAccount): void {
    this.editing.set(account);
  }

  cancelEdit(): void {
    this.editing.set(null);
  }
}
