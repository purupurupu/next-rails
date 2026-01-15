/**
 * Common hook return type interfaces
 * Ensures consistency across all resource hooks
 */

/**
 * CRUD hooks の共通戻り値インターフェース
 */
export interface UseResourceReturn<T, TCreateData, TUpdateData> {
  // Data
  data: T[];

  // Loading & Error
  isLoading: boolean;
  error: Error | null;

  // CRUD Operations
  create: (data: TCreateData) => Promise<T | undefined>;
  update: (id: number, data: TUpdateData) => Promise<T | undefined>;
  remove: (id: number) => Promise<void>;

  // Refresh
  refetch: () => Promise<void>;
}

/**
 * Read-only hooks の共通戻り値インターフェース
 */
export interface UseReadOnlyResourceReturn<T> {
  data: T[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * SWR hooks の共通戻り値インターフェース
 */
export interface UseSWRResourceReturn<T, TCreateData, TUpdateData>
  extends UseResourceReturn<T, TCreateData, TUpdateData> {
  // SWR mutate function for manual cache updates
  mutate: () => Promise<T[] | undefined>;
}
