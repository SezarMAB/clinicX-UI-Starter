/** Generic response from authentication test endpoints */
export interface AuthTestResponse {
  readonly message: string;
  readonly user?: string;
  readonly roles?: string[];
  readonly timestamp?: string;
}
