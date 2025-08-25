/** Error model for API responses */
export interface ErrorModel {
  /** HTTP status code */
  readonly status: number;
  /** Error message */
  readonly message: string;
  /** Timestamp of the error */
  readonly timestamp?: string;
  /** Request path that caused the error */
  readonly path?: string;
  /** Additional error details */
  readonly details?: Record<string, unknown>;
}
