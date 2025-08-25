import { computed, inject, Injectable, signal, Signal } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { ChartToothDto, ToothConditionUpdateRequest, DentalChartDto } from './dental-charts.models';

/**
 * Service for managing dental charts
 * Provides reactive queries via httpResource for GET operations
 * and Observable-based mutations for POST/PUT/PATCH/DELETE operations
 */
@Injectable({ providedIn: 'root' })
export class DentalChartsService {
  private readonly apiService = inject(ApiService);

  // --- GET Operations (httpResource with signals) ---

  /**
   * Get patient dental chart
   * @param patientId Signal containing the patient ID
   */
  getPatientDentalChart(patientId: Signal<string>) {
    return this.apiService.apiGetResource<DentalChartDto>(
      computed(() => `/api/v1/dental-charts/patient/${patientId()}`)
    );
  }

  /**
   * Get tooth details
   * @param patientId Signal containing the patient ID
   * @param toothId Signal containing the tooth ID (FDI notation)
   */
  getToothDetails(patientId: Signal<string>, toothId: Signal<string>) {
    return this.apiService.apiGetResource<ChartToothDto>(
      computed(() => `/api/v1/dental-charts/patient/${patientId()}/tooth/${toothId()}`)
    );
  }

  // --- POST/PUT/PATCH/DELETE Operations (Observables) ---

  /**
   * Initialize dental chart for patient
   * @param patientId Patient ID
   * @returns Observable of the created dental chart
   */
  initializeDentalChart(patientId: string): Observable<DentalChartDto> {
    return this.apiService.post<DentalChartDto>(
      `/api/v1/dental-charts/patient/${patientId}/initialize`,
      {}
    );
  }

  /**
   * Update tooth condition
   * @param patientId Patient ID
   * @param toothId Tooth ID (FDI notation)
   * @param request Tooth condition update data
   * @returns Observable of the updated tooth
   */
  updateToothCondition(
    patientId: string,
    toothId: string,
    request: ToothConditionUpdateRequest
  ): Observable<ChartToothDto> {
    return this.apiService.put<ChartToothDto>(
      `/api/v1/dental-charts/patient/${patientId}/tooth/${toothId}`,
      request
    );
  }

  /**
   * Update tooth surface condition
   * @param patientId Patient ID
   * @param toothId Tooth ID (FDI notation)
   * @param surfaceName Surface name
   * @param condition Condition
   * @param notes Optional notes
   * @returns Observable of the updated tooth
   */
  updateSurfaceCondition(
    patientId: string,
    toothId: string,
    surfaceName: string,
    condition: string,
    notes?: string
  ): Observable<ChartToothDto> {
    const params = { condition, ...(notes && { notes }) };
    return this.apiService.put<ChartToothDto>(
      `/api/v1/dental-charts/patient/${patientId}/tooth/${toothId}/surface/${surfaceName}`,
      {},
      params
    );
  }
}
