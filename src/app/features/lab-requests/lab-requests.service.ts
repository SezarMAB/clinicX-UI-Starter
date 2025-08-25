import { computed, inject, Injectable, signal, Signal } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { PageRequest } from '../../core/models/pagination.model';
import { LabRequestDto, LabRequestCreateRequest, PageLabRequestDto } from './lab-requests.models';

/**
 * Service for managing lab requests
 * Provides reactive queries via httpResource for GET operations
 * and Observable-based mutations for POST/PUT operations
 */
@Injectable({ providedIn: 'root' })
export class LabRequestsService {
  private readonly apiService = inject(ApiService);

  // --- GET Operations (httpResource with signals) ---

  /**
   * Get lab request by ID
   * @param labRequestId Signal containing the lab request ID
   */
  getLabRequestById(labRequestId: Signal<string>) {
    return this.apiService.apiGetResource<LabRequestDto>(
      computed(() => `/api/v1/lab-requests/${labRequestId()}`)
    );
  }

  /**
   * Get patient lab requests
   * @param patientId Signal containing the patient ID
   * @param pageRequest Signal containing pagination parameters
   */
  getPatientLabRequests(patientId: Signal<string>, pageRequest: Signal<PageRequest>) {
    return this.apiService.apiGetResource<PageLabRequestDto>(
      computed(() => `/api/v1/lab-requests/patient/${patientId()}`),
      { params: computed(() => pageRequest() as Record<string, unknown>) }
    );
  }

  // --- POST/PUT Operations (Observables) ---

  /**
   * Create lab request
   * @param request Lab request data
   * @returns Observable of created lab request
   */
  createLabRequest(request: LabRequestCreateRequest): Observable<LabRequestDto> {
    return this.apiService.post<LabRequestDto>('/api/v1/lab-requests', request);
  }

  /**
   * Update lab request status
   * @param labRequestId Lab request ID
   * @param status New status
   * @returns Observable of updated lab request
   */
  updateLabRequestStatus(labRequestId: string, status: string): Observable<LabRequestDto> {
    return this.apiService.put<LabRequestDto>(
      `/api/v1/lab-requests/${labRequestId}/status`,
      {},
      { status }
    );
  }
}
