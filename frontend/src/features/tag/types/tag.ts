import type { BaseEntity, CreateData, UpdateData, ValidationErrors } from "@/types/common";

/**
 * Tag domain types
 */

export interface Tag extends BaseEntity {
  name: string;
  color: string;
}

// Tag operations
export type CreateTagData = CreateData<Pick<Tag, "name" | "color">>;
export type UpdateTagData = UpdateData<Pick<Tag, "name" | "color">>;

// Error types
export type TagValidationErrors = ValidationErrors;
