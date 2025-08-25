import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { StaffService } from './staff.service';
import { ApiService } from '../../core/api/api.service';
import { API_CONFIG } from '../../core/api/api.config';
import { StaffDto, StaffCreateRequest } from './staff.models';

describe('StaffService', () => {
  let service: StaffService;
  let httpMock: HttpTestingController;

  const mockApiConfig = {
    baseUrl: '/api',
    withCredentials: true,
    headers: { Accept: 'application/json' },
    useAuthHeader: false,
  };

  const mockStaff: StaffDto = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    employeeId: 'EMP-001',
    firstName: 'Dr. John',
    lastName: 'Smith',
    email: 'john.smith@clinic.com',
    phoneNumber: '+1234567890',
    role: 'DENTIST',
    specialtyId: 'spec-123',
    specialtyName: 'General Dentistry',
    status: 'ACTIVE',
    hireDate: '2020-01-15',
    salary: 120000,
    workingHours: '9:00-17:00',
    notes: 'Experienced dentist',
    createdAt: '2020-01-15T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [StaffService, ApiService, { provide: API_CONFIG, useValue: mockApiConfig }],
    });

    service = TestBed.inject(StaffService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create a staff member', () => {
    const createRequest: StaffCreateRequest = {
      employeeId: 'EMP-002',
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane.doe@clinic.com',
      role: 'HYGIENIST',
      hireDate: '2023-01-01',
      salary: 65000,
    };

    service.createStaff(createRequest).subscribe(staff => {
      expect(staff).toEqual(mockStaff);
    });

    const req = httpMock.expectOne('/api/staff');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(createRequest);

    req.flush(mockStaff);
  });

  it('should verify httpResource for getStaffById', () => {
    const staffId = signal('staff-123');
    const resource = service.getStaffById(staffId);

    expect(resource.value).toBeDefined();
    expect(resource.status).toBeDefined();
    expect(resource.error).toBeDefined();
  });
});
