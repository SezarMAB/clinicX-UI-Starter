import { Nullable } from '../../core/api/api.service';
import { PageResponse } from '../../core/models/pagination.model';

/** Treatment material DTO */
export interface TreatmentMaterialDto {
  readonly id: string; // UUID
  readonly visitId: string; // UUID
  readonly materialName: string;
  readonly quantity: number;
  readonly unit: string;
  readonly costPerUnit: number;
  readonly totalCost: number;
  readonly supplier: Nullable<string>;
  readonly batchNumber: Nullable<string>;
  readonly notes: Nullable<string>;
  readonly createdAt: string; // ISO 8601 date-time
  readonly updatedAt: string; // ISO 8601 date-time
}

/** Request to create a new treatment material */
export interface TreatmentMaterialCreateRequest {
  readonly visitId: string; // UUID
  readonly materialName: string;
  readonly quantity: number;
  readonly unit?: string;
  readonly costPerUnit: number;
  readonly supplier?: string;
  readonly batchNumber?: string;
  readonly notes?: string;
}

/** Search criteria for treatment materials */
export interface TreatmentMaterialSearchCriteria {
  readonly visitId?: string; // UUID
  readonly patientId?: string; // UUID
  readonly materialName?: string;
  readonly materialNames?: readonly string[];
  readonly materialNameContains?: string;
  readonly supplier?: string;
  readonly suppliers?: readonly string[];
  readonly batchNumber?: string;
  readonly unit?: string;
  readonly quantityFrom?: number;
  readonly quantityTo?: number;
  readonly costPerUnitFrom?: number;
  readonly costPerUnitTo?: number;
  readonly totalCostFrom?: number;
  readonly totalCostTo?: number;
  readonly notesContain?: string;
  readonly usedFrom?: string; // ISO 8601 date
  readonly usedTo?: string; // ISO 8601 date
  readonly createdFrom?: string; // ISO 8601 date
  readonly createdTo?: string; // ISO 8601 date
}

/** Paginated treatment material response */
export type PageTreatmentMaterialDto = PageResponse<TreatmentMaterialDto>;

/** Total cost response */
export interface TotalCostResponse {
  readonly totalCost: number;
  readonly currency: string;
  readonly materialCount: number;
}
