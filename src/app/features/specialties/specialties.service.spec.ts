import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { ApiService } from '../../core/api/api.service';
import { API_CONFIG } from '../../core/api/api.config';
import { SpecialtiesService } from './specialties.service';
import { SpecialtyDto, SpecialtyCreateRequest } from './specialties.models';

describe('SpecialtiesService', () => {
  let service: SpecialtiesService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        SpecialtiesService,
        ApiService,
        {
          provide: API_CONFIG,
          useValue: {
            baseUrl: '/api',
            withCredentials: true,
            headers: { Accept: 'application/json' },
          },
        },
      ],
    });

    service = TestBed.inject(SpecialtiesService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getSpecialtyById', () => {
    it('should get specialty by ID', () => {
      const specialtyId = signal('specialty-123');
      const mockSpecialty: SpecialtyDto = {
        id: 'specialty-123',
        name: 'Orthodontics',
        code: 'ORTHO',
        description: 'Teeth alignment and braces',
        isActive: true,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      const resource = service.getSpecialtyById(specialtyId);

      // Trigger the resource by accessing its value
      const result = resource.value();

      const req = httpTestingController.expectOne('/api/v1/specialties/specialty-123');
      expect(req.request.method).toBe('GET');
      expect(req.request.withCredentials).toBe(true);

      req.flush(mockSpecialty);
    });
  });

  describe('createSpecialty', () => {
    it('should create specialty', () => {
      const createRequest: SpecialtyCreateRequest = {
        name: 'Periodontics',
        code: 'PERIO',
        description: 'Gum and supporting structures',
      };

      const expectedSpecialty: SpecialtyDto = {
        id: 'specialty-456',
        name: 'Periodontics',
        code: 'PERIO',
        description: 'Gum and supporting structures',
        isActive: true,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      service.createSpecialty(createRequest).subscribe(specialty => {
        expect(specialty).toEqual(expectedSpecialty);
      });

      const req = httpTestingController.expectOne('/api/v1/specialties');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createRequest);
      expect(req.request.withCredentials).toBe(true);

      req.flush(expectedSpecialty);
    });
  });

  describe('deleteSpecialty', () => {
    it('should delete specialty', () => {
      const specialtyId = 'specialty-789';

      service.deleteSpecialty(specialtyId).subscribe();

      const req = httpTestingController.expectOne('/api/v1/specialties/specialty-789');
      expect(req.request.method).toBe('DELETE');
      expect(req.request.withCredentials).toBe(true);

      req.flush(null);
    });
  });
});
