import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PersonalService } from './personal.service';
import { environment } from '../../../../../environments/environment';
import { PERSONAL_FIXTURE } from '../../adapters/fixtures/personal.fixture';

describe('PersonalService', () => {
  let service: PersonalService;
  let httpMock: HttpTestingController;
  const originalApiUrl = environment.apiUrl;

  const build = () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PersonalService);
    httpMock = TestBed.inject(HttpTestingController);
  };

  beforeEach(() => TestBed.resetTestingModule());

  afterEach(() => {
    environment.apiUrl = originalApiUrl;
  });

  it('debe listar el personal del tenant', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let result: unknown;

    service.list().subscribe((employees) => (result = employees));

    httpMock.expectOne('https://api.test/field/personal').flush(PERSONAL_FIXTURE);

    expect(result).toHaveLength(2);
  });

  it('debe traducir errores y fallar sin apiUrl', () => {
    environment.apiUrl = 'https://api.test';
    build();
    const errors: Error[] = [];

    service.list().subscribe({ error: (e: Error) => errors.push(e) });
    httpMock
      .expectOne('https://api.test/field/personal')
      .flush({ mensaje: 'Sin personal.' }, { status: 403, statusText: 'Forbidden' });

    expect(errors[0].message).toBe('Sin personal.');

    environment.apiUrl = '';
    const missing: Error[] = [];
    service.list().subscribe({ error: (e: Error) => missing.push(e) });
    expect(missing[0].message).toContain('apiUrl no configurado');
  });
});
