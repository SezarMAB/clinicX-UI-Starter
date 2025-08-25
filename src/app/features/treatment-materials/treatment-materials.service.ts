import { computed, inject, Injectable, signal, Signal } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core';
import { PageRequest } from '@core';
import {
  TreatmentMaterialDto,
  TreatmentMaterialCreateRequest,
  TreatmentMaterialSearchCriteria,
  PageTreatmentMaterialDto,
  TotalCostResponse,
} from './treatment-materials.models';

/**
 * Service for managing treatment materials
 * Provides reactive queries via httpResource for GET operations
 * and Observable-based mutations for POST/PUT/PATCH/DELETE operations
 */
@Injectable({ providedIn: 'root' })
export class TreatmentMaterialsService {
  private readonly apiService = inject(ApiService);

  // --- GET Operations (httpResource with signals) ---

  /**
   * Get treatment material by ID
   * @param materialId Signal containing the material ID
   */
  getTreatmentMaterial(materialId: Signal<string>) {
    return this.apiService.apiGetResource<TreatmentMaterialDto>(
      computed(() => `/api/v1/treatment-materials/${materialId()}`)
    );
  }

  /**
   * Get materials by treatment ID
   * @param treatmentId Signal containing the treatment ID
   */
  getMaterialsByTreatment(treatmentId: Signal<string>) {
    return this.apiService.apiGetResource<TreatmentMaterialDto[]>(
      computed(() => `/api/v1/treatment-materials/treatment/${treatmentId()}`)
    );
  }

  /**
   * Get materials by treatment ID with pagination
   * @param treatmentId Signal containing the treatment ID
   * @param pageRequest Signal containing pagination parameters
   */
  getMaterialsByTreatmentPaged(treatmentId: Signal<string>, pageRequest: Signal<PageRequest>) {
    return this.apiService.apiGetResource<PageTreatmentMaterialDto>(
      computed(() => `/api/v1/treatment-materials/treatment/${treatmentId()}/paged`),
      {
        params: computed(() => pageRequest() as Record<string, unknown>),
      }
    );
  }

  /**
   * Get total material cost for a treatment
   * @param treatmentId Signal containing the treatment ID
   */
  getTotalMaterialCostByTreatment(treatmentId: Signal<string>) {
    return this.apiService.apiGetResource<TotalCostResponse>(
      computed(() => `/api/v1/treatment-materials/treatment/${treatmentId()}/total-cost`)
    );
  }

  /**
   * Get materials by patient ID
   * @param patientId Signal containing the patient ID
   */
  getMaterialsByPatient(patientId: Signal<string>) {
    return this.apiService.apiGetResource<TreatmentMaterialDto[]>(
      computed(() => `/api/v1/treatment-materials/patient/${patientId()}`)
    );
  }

  /**
   * Get materials by patient ID with pagination
   * @param patientId Signal containing the patient ID
   * @param pageRequest Signal containing pagination parameters
   */
  getMaterialsByPatientPaged(patientId: Signal<string>, pageRequest: Signal<PageRequest>) {
    return this.apiService.apiGetResource<PageTreatmentMaterialDto>(
      computed(() => `/api/v1/treatment-materials/patient/${patientId()}/paged`),
      {
        params: computed(() => pageRequest() as Record<string, unknown>),
      }
    );
  }

  /**
   * Get total material cost for a patient
   * @param patientId Signal containing the patient ID
   */
  getTotalMaterialCostByPatient(patientId: Signal<string>) {
    return this.apiService.apiGetResource<TotalCostResponse>(
      computed(() => `/api/v1/treatment-materials/patient/${patientId()}/total-cost`)
    );
  }

  // --- POST/PUT/PATCH/DELETE Operations (Observables) ---

  /**
   * Create a new treatment material record
   * @param request Material creation data
   * @returns Observable of the created material
   */
  createTreatmentMaterial(
    request: TreatmentMaterialCreateRequest
  ): Observable<TreatmentMaterialDto> {
    return this.apiService.post<TreatmentMaterialDto>('/api/v1/treatment-materials', request);
  }

  /**
   * Update an existing treatment material
   * @param materialId Material ID to update
   * @param request Updated material data
   * @returns Observable of the updated material
   */
  updateTreatmentMaterial(
    materialId: string,
    request: TreatmentMaterialCreateRequest
  ): Observable<TreatmentMaterialDto> {
    return this.apiService.put<TreatmentMaterialDto>(
      `/api/v1/treatment-materials/${materialId}`,
      request
    );
  }

  /**
   * Delete a treatment material
   * @param materialId Material ID to delete
   * @returns Observable that completes when material is deleted
   */
  deleteTreatmentMaterial(materialId: string): Observable<void> {
    return this.apiService.delete<void>(`/api/v1/treatment-materials/${materialId}`);
  }

  /**
   * Advanced search for treatment materials
   * @param searchCriteria Search criteria
   * @param pageRequest Pagination parameters
   * @returns Observable of search results
   */
  searchMaterials(
    searchCriteria: TreatmentMaterialSearchCriteria,
    pageRequest?: PageRequest
  ): Observable<PageTreatmentMaterialDto> {
    return this.apiService.post<PageTreatmentMaterialDto>(
      '/api/v1/treatment-materials/search',
      searchCriteria,
      pageRequest as Record<string, unknown> | undefined
    );
  }
}
