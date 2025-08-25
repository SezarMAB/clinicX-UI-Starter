import { computed, inject, Injectable, signal, Signal } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { PageRequest } from '../../core/models/pagination.model';
import { NoteSummaryDto, NoteCreateRequest, NoteUpdateRequest } from './notes.models';

/**
 * Service for managing patient notes
 * Provides reactive queries via httpResource for GET operations
 * and Observable-based mutations for POST/PUT/PATCH/DELETE operations
 */
@Injectable({ providedIn: 'root' })
export class NotesService {
  private readonly apiService = inject(ApiService);

  // --- GET Operations (httpResource with signals) ---

  /**
   * Get note by ID
   * @param noteId Signal containing the note ID
   */
  getNoteById(noteId: Signal<string>) {
    return this.apiService.apiGetResource<NoteSummaryDto>(
      computed(() => `/api/v1/notes/${noteId()}`)
    );
  }

  /**
   * Get patient notes
   * @param patientId Signal containing the patient ID
   * @param pageRequest Signal containing pagination parameters
   */
  getPatientNotes(patientId: Signal<string>, pageRequest: Signal<PageRequest>) {
    return this.apiService.apiGetResource<NoteSummaryDto[]>(
      computed(() => `/api/v1/notes/patient/${patientId()}`),
      {
        params: computed(() => pageRequest() as Record<string, unknown>),
      }
    );
  }

  // --- POST/PUT/PATCH/DELETE Operations (Observables) ---

  /**
   * Create a new note
   * @param request Note creation data
   * @returns Observable of the created note
   */
  createNote(request: NoteCreateRequest): Observable<NoteSummaryDto> {
    return this.apiService.post<NoteSummaryDto>('/api/v1/notes', request);
  }

  /**
   * Update an existing note
   * @param noteId Note ID to update
   * @param request Updated note data
   * @returns Observable of the updated note
   */
  updateNote(noteId: string, request: NoteUpdateRequest): Observable<NoteSummaryDto> {
    return this.apiService.put<NoteSummaryDto>(`/api/v1/notes/${noteId}`, request);
  }

  /**
   * Delete a note
   * @param noteId Note ID to delete
   * @returns Observable that completes when note is deleted
   */
  deleteNote(noteId: string): Observable<void> {
    return this.apiService.delete<void>(`/api/v1/notes/${noteId}`);
  }
}
