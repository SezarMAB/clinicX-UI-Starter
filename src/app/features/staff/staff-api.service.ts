import { inject, Injectable, Signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../core/api/api.service';
import { API_CONFIG, ApiConfig } from '../../core/api/api.config';
import {
  StaffDto,
  StaffCreateRequest,
  StaffUpdateRequest,
  StaffSearchCriteria,
  StaffRole,
  Page,
  PageableOptions,
} from './staff.models';

@Injectable({ providedIn: 'root' })
export class StaffApiService {
  private readonly api = inject(ApiService);
  private readonly http = inject(HttpClient);
  private readonly config = inject<ApiConfig>(API_CONFIG);

  private readonly basePath = '/api/v1/staff';

  // Signal-based resources for UI components

  /**
   * Get staff member by ID (signal-based)
   */
  getByIdResource(id: Signal<string>) {
    const path = computed(() => (id() ? `${this.basePath}/${id()}` : ''));
    return this.api.apiGetResource<StaffDto>(path);
  }

  /**
   * List all staff members (signal-based)
   */
  listResource(opts: Signal<PageableOptions>) {
    const params = computed(() => this.buildPageableParams(opts()));
    return this.api.apiGetResource<Page<StaffDto>>(this.basePath, {
      params: computed(() => params()),
    });
  }

  /**
   * List active staff members (signal-based)
   */
  listActiveResource(opts: Signal<PageableOptions>) {
    const params = computed(() => this.buildPageableParams(opts()));
    return this.api.apiGetResource<Page<StaffDto>>(`${this.basePath}/active`, {
      params: computed(() => params()),
    });
  }

  /**
   * List staff members by role (signal-based)
   */
  listByRoleResource(role: Signal<StaffRole>, opts: Signal<PageableOptions>) {
    const path = computed(() => (role() ? `${this.basePath}/by-role/${role()}` : ''));
    const params = computed(() => this.buildPageableParams(opts()));
    return this.api.apiGetResource<Page<StaffDto>>(path, {
      params: computed(() => params()),
    });
  }

  /**
   * Search staff members (signal-based)
   */
  searchResource(searchTerm: Signal<string | null>, opts: Signal<PageableOptions>) {
    const params = computed(() => {
      const pageParams = this.buildPageableParams(opts());
      const term = searchTerm();
      if (term) {
        pageParams.searchTerm = term;
      }
      return pageParams;
    });

    return this.api.apiGetResource<Page<StaffDto>>(`${this.basePath}/search`, {
      params: computed(() => params()),
    });
  }

  // Observable-based methods for resolvers and imperative calls

  /**
   * Get staff member by ID (one-off Observable)
   */
  getByIdOnce(id: string): Observable<StaffDto> {
    return this.http.get<StaffDto>(`${this.config.baseUrl}${this.basePath}/${id}`, {
      withCredentials: this.config.withCredentials,
      headers: this.config.headers,
    });
  }

  /**
   * Advanced search with criteria (POST)
   */
  advancedSearch(criteria: StaffSearchCriteria, opts: PageableOptions): Observable<Page<StaffDto>> {
    const params = this.api.createParams(this.buildPageableParams(opts));
    return this.api.post<Page<StaffDto>>(`${this.basePath}/search/advanced`, criteria, params);
  }

  // CRUD operations

  /**
   * Create new staff member
   */
  create(payload: StaffCreateRequest): Observable<StaffDto> {
    return this.api.post<StaffDto>(this.basePath, payload);
  }

  /**
   * Update existing staff member
   */
  update(id: string, payload: StaffUpdateRequest): Observable<StaffDto> {
    return this.api.put<StaffDto>(`${this.basePath}/${id}`, payload);
  }

  /**
   * Delete staff member (soft delete)
   */
  delete(id: string): Observable<void> {
    return this.api.delete<void>(`${this.basePath}/${id}`).pipe(
      map(() => void 0) // Handle 204 No Content
    );
  }

  // Helper methods

  /**
   * Build pageable params object for Spring Data
   */
  private buildPageableParams(opts: PageableOptions): Record<string, unknown> {
    const params: Record<string, unknown> = {
      page: opts.page,
      size: opts.size,
    };

    if (opts.sort) {
      params.sort = opts.sort;
    }

    return params;
  }

  /**
   * Map MatSort to sort params
   */
  mapMatSortToSortParams(sort: { active: string; direction: string }): string[] {
    if (!sort.active || !sort.direction) {
      return [];
    }
    return [`${sort.active},${sort.direction}`];
  }
}
