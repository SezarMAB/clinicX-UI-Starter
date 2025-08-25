/** Clinic information DTO */
export interface ClinicInfoDto {
  readonly id: string; // UUID
  readonly clinicName: string;
  readonly address: string;
  readonly city: string;
  readonly state: string;
  readonly zipCode: string;
  readonly country: string;
  readonly phone: string;
  readonly email: string;
  readonly website?: string;
  readonly description?: string;
  readonly operatingHours?: Record<string, string>; // Day -> Hours mapping
  readonly timezone: string;
  readonly logoUrl?: string;
}

/** Clinic information update request */
export interface ClinicInfoUpdateRequest {
  readonly clinicName?: string;
  readonly address?: string;
  readonly city?: string;
  readonly state?: string;
  readonly zipCode?: string;
  readonly country?: string;
  readonly phone?: string;
  readonly email?: string;
  readonly website?: string;
  readonly description?: string;
  readonly operatingHours?: Record<string, string>;
  readonly timezone?: string;
}
