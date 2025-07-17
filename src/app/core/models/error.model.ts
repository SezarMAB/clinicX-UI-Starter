/**
 * Standard error response model
 * @interface ApiError
 */
export interface ApiError {
  /** HTTP status code */
  status: number;
  /** Error message */
  message: string;
  /** Timestamp of the error */
  timestamp?: string;
  /** Request path that caused the error */
  path?: string;
  /** Additional error details */
  details?: Record<string, any>;
  /** Validation errors for specific fields */
  fieldErrors?: Record<string, string[]>;
}

/**
 * Field validation error
 * @interface FieldError
 */
export interface FieldError {
  /** Field name */
  field: string;
  /** Error message */
  message: string;
  /** Rejected value */
  rejectedValue?: any;
}

/**
 * HTTP error response wrapper
 * @interface HttpError
 */
export interface HttpError {
  /** HTTP status code */
  status: number;
  /** Error message */
  message: string;
  /** Original error object */
  originalError?: any;
}
