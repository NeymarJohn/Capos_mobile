import { TestBed } from '@angular/core/testing';

import { OpenRegisterService } from './open-register.service';

describe('OpenRegisterService', () => {
  let service: OpenRegisterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OpenRegisterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});