import { Injectable, Signal, computed, signal, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core/api';
import { Page, PageableRequest } from '@core/models';
import {
  PatientCreateRequest,
  PatientUpdateRequest,
  PatientSummaryDto,
  PatientSearchCriteria,
} from './patients.models';
import { TreatmentLogDto } from '../treatments/treatments.models';
import { NoteSummaryDto } from '../notes/notes.models';
import { LabRequestDto } from '../lab-requests/lab-requests.models';
import { FinancialRecordDto } from '../invoices/invoices.models';
import { DocumentSummaryDto } from '../documents/documents.models';

/**
 * Service for managing patients
 * Operations related to patient management
 * @class PatientsService
 */
@Injectable({ providedIn: 'root' })
export class PatientsService {
  private readonly basePath = '/api/v1/patients';
  private readonly api = inject(ApiService);

  /**
   * Get all patients
   * Retrieves paginated list of patients with optional search filtering
   * @param searchTerm Optional search term for filtering patients
   * @param pageable Pagination parameters
   * @returns Observable of paginated patients
   */
  getAllPatients(
    searchTerm?: string,
    pageable?: PageableRequest
  ): Observable<Page<PatientSummaryDto>> {
    const params = this.api.createParams({
      searchTerm,
      page: pageable?.page ?? 0,
      size: pageable?.size ?? 20,
      sort: pageable?.sort ?? 'fullName',
    });

    return this.api.get<Page<PatientSummaryDto>>(this.basePath, params);
  }

  /**
   * Get all patients (Signal-based)
   * Retrieves paginated list of patients with optional search filtering
   * @param searchTerm Search term signal
   * @param pageable Pagination parameters signal
   * @returns Signal-based resource of paginated patients
   */
  getAllPatientsResource(
    searchTerm?: Signal<string | undefined>,
    pageable?: Signal<PageableRequest | undefined>
  ) {
    const params = computed(() => {
      const search = searchTerm?.();
      const p = pageable?.();

      return this.api.createParams({
        searchTerm: search,
        page: p?.page ?? 0,
        size: p?.size ?? 20,
        sort: p?.sort ?? 'fullName',
      });
    });

    return this.api.apiGetResource<Page<PatientSummaryDto>>(signal(this.basePath), params);
  }

  /**
   * Create new patient
   * Creates a new patient record in the system
   * @param request Patient creation request
   * @returns Observable of created patient
   */
  createPatient(request: PatientCreateRequest): Observable<PatientSummaryDto> {
    return this.api.post<PatientSummaryDto>(this.basePath, request);
  }

  /**
   * Get patient by ID
   * Retrieves a patient by their unique identifier
   * @param id Patient ID
   * @returns Signal-based resource of patient
   */
  getPatientById(id: string | Signal<string>) {
    const path =
      typeof id === 'string'
        ? signal(`${this.basePath}/${id}`)
        : computed(() => `${this.basePath}/${id()}`);

    return this.api.apiGetResource<PatientSummaryDto>(path);
  }

  /**
   * Update patient
   * Updates an existing patient record
   * @param id Patient ID
   * @param request Patient update request
   * @returns Observable of updated patient
   */
  updatePatient(id: string, request: PatientUpdateRequest): Observable<PatientSummaryDto> {
    return this.api.put<PatientSummaryDto>(`${this.basePath}/${id}`, request);
  }

  /**
   * Delete patient
   * Deletes a patient record by setting them as inactive
   * @param id Patient ID
   * @returns Observable of void
   */
  deletePatient(id: string): Observable<void> {
    return this.api.delete<void>(`${this.basePath}/${id}`);
  }

  /**
   * Advanced patient search
   * Search patients with multiple criteria and filters
   * @param criteria Search criteria
   * @param pageable Pagination parameters
   * @returns Observable of paginated patients
   */
  searchPatients(
    criteria: PatientSearchCriteria,
    pageable?: PageableRequest
  ): Observable<Page<PatientSummaryDto>> {
    const params = this.api.createParams({
      page: pageable?.page ?? 0,
      size: pageable?.size ?? 20,
      sort: pageable?.sort ?? 'fullName',
    });

    return this.api.post<Page<PatientSummaryDto>>(`${this.basePath}/search`, criteria, params);
  }

  /**
   * Get patient treatment history
   * Retrieves paginated treatment history for a specific patient
   * @param patientId Patient ID
   * @param pageable Pagination parameters
   * @returns Observable of paginated treatments
   */
  getPatientTreatmentHistory(
    patientId: string,
    pageable?: PageableRequest
  ): Observable<Page<TreatmentLogDto>> {
    const params = this.api.createParams({
      page: pageable?.page ?? 0,
      size: pageable?.size ?? 20,
      sort: pageable?.sort ?? 'treatmentDate',
    });

    return this.api.get<Page<TreatmentLogDto>>(`${this.basePath}/${patientId}/treatments`, params);
  }

  /**
   * Get patient treatment history (Signal-based)
   * Retrieves paginated treatment history for a specific patient
   * @param patientId Patient ID signal
   * @param pageable Pagination parameters signal
   * @returns Signal-based resource of paginated treatments
   */
  getPatientTreatmentHistoryResource(
    patientId: string | Signal<string>,
    pageable?: Signal<PageableRequest | undefined>
  ) {
    const path =
      typeof patientId === 'string'
        ? signal(`${this.basePath}/${patientId}/treatments`)
        : computed(() => `${this.basePath}/${patientId()}/treatments`);

    const params = computed(() => {
      const p = pageable?.();
      if (!p) return undefined;

      return this.api.createParams({
        page: p.page ?? 0,
        size: p.size ?? 20,
        sort: p.sort ?? 'treatmentDate',
      });
    });

    return this.api.apiGetResource<Page<TreatmentLogDto>>(path, params);
  }

  /**
   * Get patient notes
   * Retrieves paginated list of notes for a specific patient
   * @param patientId Patient ID
   * @param pageable Pagination parameters
   * @returns Observable of paginated notes
   */
  getPatientNotes(patientId: string, pageable?: PageableRequest): Observable<Page<NoteSummaryDto>> {
    const params = this.api.createParams({
      page: pageable?.page ?? 0,
      size: pageable?.size ?? 20,
      sort: pageable?.sort ?? 'createdAt',
    });

    return this.api.get<Page<NoteSummaryDto>>(`${this.basePath}/${patientId}/notes`, params);
  }

  /**
   * Get patient lab requests
   * Retrieves paginated list of lab requests for a specific patient
   * @param patientId Patient ID
   * @param pageable Pagination parameters
   * @returns Observable of paginated lab requests
   */
  getPatientLabRequests(
    patientId: string,
    pageable?: PageableRequest
  ): Observable<Page<LabRequestDto>> {
    const params = this.api.createParams({
      page: pageable?.page ?? 0,
      size: pageable?.size ?? 20,
      sort: pageable?.sort ?? 'requestDate',
    });

    return this.api.get<Page<LabRequestDto>>(`${this.basePath}/${patientId}/lab-requests`, params);
  }

  /**
   * Get patient financial records
   * Retrieves paginated financial records for a specific patient
   * @param patientId Patient ID
   * @param pageable Pagination parameters
   * @returns Observable of paginated financial records
   */
  getPatientFinancialRecords(
    patientId: string,
    pageable?: PageableRequest
  ): Observable<Page<FinancialRecordDto>> {
    const params = this.api.createParams({
      page: pageable?.page ?? 0,
      size: pageable?.size ?? 20,
      sort: pageable?.sort ?? 'invoiceDate',
    });

    return this.api.get<Page<FinancialRecordDto>>(
      `${this.basePath}/${patientId}/financial-records`,
      params
    );
  }

  /**
   * Get patient documents
   * Retrieves paginated list of documents for a specific patient
   * @param patientId Patient ID
   * @param pageable Pagination parameters
   * @returns Observable of paginated documents
   */
  getPatientDocuments(
    patientId: string,
    pageable?: PageableRequest
  ): Observable<Page<DocumentSummaryDto>> {
    const params = this.api.createParams({
      page: pageable?.page ?? 0,
      size: pageable?.size ?? 20,
      sort: pageable?.sort ?? 'createdAt',
    });

    return this.api.get<Page<DocumentSummaryDto>>(
      `${this.basePath}/${patientId}/documents`,
      params
    );
  }
}
