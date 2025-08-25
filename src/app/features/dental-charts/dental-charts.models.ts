import { Nullable } from '../../core/api/api.service';

/** Dental chart tooth DTO */
export interface ChartToothDto {
  readonly patientId: string; // UUID
  readonly toothId: string; // FDI notation (11-48)
  readonly toothName: string;
  readonly condition: string;
  readonly notes?: string;
  readonly surfaces?: ToothSurfaceDto[];
  readonly lastUpdated: string; // ISO 8601 date-time
}

/** Tooth surface DTO */
export interface ToothSurfaceDto {
  readonly surfaceName: string; // mesial, distal, buccal, lingual, occlusal
  readonly condition: string;
  readonly notes?: string;
}

/** Request to update tooth condition */
export interface ToothConditionUpdateRequest {
  readonly condition: string;
  readonly notes?: string;
}

/** Dental chart DTO */
export interface DentalChartDto {
  readonly patientId: string; // UUID
  readonly teeth: ChartToothDto[];
  readonly createdAt: string; // ISO 8601 date-time
  readonly updatedAt: string; // ISO 8601 date-time
}
