/** Enhanced pagination model shared across services. */
export interface PageRequest {
  readonly page?: number; // 0-based
  readonly size?: number; // items per page
  readonly sort?: readonly string[]; // e.g., ['createdAt,desc']
}

export interface PageResponse<T> {
  readonly content: readonly T[];
  readonly page: number;
  readonly size: number;
  readonly totalElements: number;
  readonly totalPages: number;
  readonly sort?: readonly string[];
}
