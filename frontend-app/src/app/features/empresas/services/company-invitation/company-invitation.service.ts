import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, delay, map } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import { toUserMessage } from '../../../../core/models/api-error';
import {
  adaptAcceptedSellerInvitationFromBackend,
  adaptCompanyVendorsFromBackend,
  adaptPublicSellerInvitationFromBackend,
  adaptSellerInvitationFromBackend,
} from '../../adapters/company-invitation/company-invitation.adapter';
import type {
  AcceptedSellerInvitation,
  AcceptSellerInvitationData,
  CompanyVendorsSnapshot,
  CreateSellerInvitationData,
  PublicSellerInvitation,
  SellerInvitation,
} from '../../models/company-invitation.model';
import { CompanyInvitationRepository } from '../../repositories/company-invitation.repository';

const LOOPBACK_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1']);

export function normalizeInvitationUrl(
  invitationUrl: string,
  frontendUrl: string,
  production: boolean,
): string {
  if (!production || !invitationUrl || !frontendUrl) return invitationUrl;

  try {
    const invitation = new URL(invitationUrl);
    if (!LOOPBACK_HOSTNAMES.has(invitation.hostname)) return invitationUrl;

    const publicOrigin = frontendUrl.replace(/\/+$/, '');
    return `${publicOrigin}${invitation.pathname}${invitation.search}${invitation.hash}`;
  } catch {
    return invitationUrl;
  }
}

@Injectable({ providedIn: 'root' })
export class CompanyInvitationService implements CompanyInvitationRepository {
  private readonly http = inject(HttpClient);
  private readonly endpoint = environment.apiConfig?.endpoints?.companies || '/empresas';
  private readonly apiUrl = `${environment.apiUrl}${this.endpoint}`;

  create(companyId: string, data: CreateSellerInvitationData): Observable<SellerInvitation> {
    if (this.isMock()) {
      return of({
        id: `inv-${Date.now()}`,
        companyId,
        storeId: data.storeId,
        storeName: 'Tienda disponible',
        email: data.email,
        participationPercentage: data.participationPercentage,
        status: 'pendiente',
        expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
        invitationUrl: `${globalThis.location?.origin ?? environment.frontendUrl}/registro/vendedor?token=mock-token`,
      }).pipe(delay(250));
    }
    if (!environment.apiUrl) return this.missingApiUrl();

    return this.http
      .post<unknown>(`${this.apiUrl}/${encodeURIComponent(companyId)}/invitaciones/vendedores`, {
        correo: data.email,
        tienda_id: data.storeId,
        participacion_porcentaje: data.participationPercentage,
        ...(data.name?.trim() ? { nombre: data.name.trim() } : {}),
      })
      .pipe(
        map((response) => adaptSellerInvitationFromBackend(response)),
        map((invitation) => {
          if (!invitation) throw new Error('No se pudo interpretar la invitación creada.');
          return {
            ...invitation,
            invitationUrl: normalizeInvitationUrl(
              invitation.invitationUrl,
              environment.frontendUrl,
              environment.production,
            ),
          };
        }),
        catchError((error: unknown) =>
          throwError(() => new Error(toUserMessage(error, 'No se pudo generar la invitación.'))),
        ),
      );
  }

  list(companyId: string): Observable<CompanyVendorsSnapshot> {
    if (this.isMock()) return of({ sellers: [], invitations: [] }).pipe(delay(200));
    if (!environment.apiUrl) return this.missingApiUrl();

    return this.http
      .get<unknown>(`${this.apiUrl}/${encodeURIComponent(companyId)}/vendedores`)
      .pipe(
        map((response) => adaptCompanyVendorsFromBackend(response)),
        catchError((error: unknown) =>
          throwError(
            () => new Error(toUserMessage(error, 'No se pudieron cargar los vendedores.')),
          ),
        ),
      );
  }

  revoke(companyId: string, invitationId: string): Observable<boolean> {
    if (this.isMock()) return of(true).pipe(delay(200));
    if (!environment.apiUrl) return this.missingApiUrl();

    return this.http
      .delete<unknown>(
        `${this.apiUrl}/${encodeURIComponent(companyId)}/invitaciones/vendedores/${encodeURIComponent(invitationId)}`,
      )
      .pipe(
        map(() => true),
        catchError((error: unknown) =>
          throwError(() => new Error(toUserMessage(error, 'No se pudo revocar la invitación.'))),
        ),
      );
  }

  getPublic(token: string): Observable<PublicSellerInvitation> {
    if (!environment.apiUrl) return this.missingApiUrl();

    return this.http
      .get<unknown>(`${environment.apiUrl}/invitaciones/vendedores/${encodeURIComponent(token)}`)
      .pipe(
        map((response) => adaptPublicSellerInvitationFromBackend(response)),
        map((invitation) => {
          if (!invitation || !invitation.valid) throw new Error('La invitación no es válida.');
          return invitation;
        }),
        catchError((error: unknown) =>
          throwError(() => new Error(toUserMessage(error, 'La invitación no es válida o expiró.'))),
        ),
      );
  }

  accept(token: string, data: AcceptSellerInvitationData): Observable<AcceptedSellerInvitation> {
    if (!environment.apiUrl) return this.missingApiUrl();

    return this.http
      .post<unknown>(
        `${environment.apiUrl}/invitaciones/vendedores/${encodeURIComponent(token)}/aceptar`,
        { nombre: data.name, contrasena: data.password },
      )
      .pipe(
        map((response) => adaptAcceptedSellerInvitationFromBackend(response)),
        catchError((error: unknown) =>
          throwError(() => new Error(toUserMessage(error, 'No se pudo aceptar la invitación.'))),
        ),
      );
  }

  private isMock(): boolean {
    return environment.apiConfig?.dataSource === 'mock';
  }

  private missingApiUrl<T>(): Observable<T> {
    return throwError(
      () =>
        new Error('apiUrl no configurado. Define environment.apiUrl para usar el backend real.'),
    );
  }
}
