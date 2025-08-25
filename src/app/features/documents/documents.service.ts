import { computed, inject, Injectable, signal, Signal } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core';
import { PageRequest } from '@core';
import { DocumentDto } from './documents.models';

/**
 * Service for managing patient documents
 * Provides reactive queries via httpResource for GET operations
 * and Observable-based mutations for DELETE operations
 */
@Injectable({ providedIn: 'root' })
export class DocumentsService {
  private readonly apiService = inject(ApiService);

  // --- GET Operations (httpResource with signals) ---

  /**
   * Get document by ID
   * @param documentId Signal containing the document ID
   */
  getDocumentById(documentId: Signal<string>) {
    return this.apiService.apiGetResource<DocumentDto>(
      computed(() => `/api/v1/documents/${documentId()}`)
    );
  }

  /**
   * Get patient documents
   * @param patientId Signal containing the patient ID
   * @param pageRequest Signal containing pagination parameters
   */
  getPatientDocuments(patientId: Signal<string>, pageRequest: Signal<PageRequest>) {
    return this.apiService.apiGetResource<DocumentDto[]>(
      computed(() => `/api/v1/documents/patient/${patientId()}`),
      { params: computed(() => pageRequest() as Record<string, unknown>) }
    );
  }

  // --- DELETE Operations (Observables) ---

  /**
   * Delete document
   * @param documentId Document ID to delete
   * @returns Observable that completes when document is deleted
   */
  deleteDocument(documentId: string): Observable<void> {
    return this.apiService.delete<void>(`/api/v1/documents/${documentId}`);
  }
}
