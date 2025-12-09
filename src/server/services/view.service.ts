import { TRPCError } from "@trpc/server";
import {
  type ViewRepository,
  type View,
  type PaginatedViewData,
  type ViewMetadata,
  type ViewFilter,
  type ViewFilterCondition,
  viewRepository,
} from "~/server/repositories/view.repository";
import { ColumnTypes } from "~/data/columnTypes";
import { TextFilterOperators, NumberFilterOperators } from "~/data/filterOperators";
import { tableRepository } from "../repositories/table.repository";
import { LogicalOperators, type LogicalOperatorValue } from "~/data/logicalOperators";

export interface ViewService {
  listViewsByTableId(tableId: string): Promise<View[]>;
  getViewRowsPaginated(viewId: string, cursor?: string, limit?: number, searchString?: string): Promise<PaginatedViewData>;
  getViewMetadata(viewId: string): Promise<ViewMetadata>;
  addHiddenColumn(viewId: string, columnId: string): Promise<void>;
  removeHiddenColumn(viewId: string, columnId: string): Promise<void>;
  getHiddenColumns(viewId: string): Promise<string[]>;
  getViewFilters(viewId: string): Promise<ViewFilter | null>;
  addViewFilterCondition(viewId: string, condition: ViewFilterCondition, operator?: LogicalOperatorValue): Promise<void>;
  removeViewFilterCondition(viewId: string, conditionIndex: number): Promise<void>;
  updateViewFilterCondition(viewId: string, conditionIndex: number, condition: ViewFilterCondition): Promise<void>;
  updateViewFilterOperator(viewId: string, operator: LogicalOperatorValue): Promise<void>;
  validateFilterConditionForColumnType(condition: ViewFilterCondition): Promise<boolean>;
}

export class ViewServiceImpl implements ViewService {
  constructor(
    private readonly viewRepository: ViewRepository
  ) {}

  async listViewsByTableId(tableId: string): Promise<View[]> {
    try {
      return await this.viewRepository.findByTableId(tableId);
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get views for table",
        cause: error,
      });
    }
  }

  async getViewRowsPaginated(viewId: string, cursor?: string, limit?: number, searchString?: string): Promise<PaginatedViewData> {
    try {
      const viewFilters = await this.viewRepository.getViewFilter(viewId);
      return await this.viewRepository.getViewRowsPaginated(viewId, cursor, limit, viewFilters, searchString);
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get paginated table rows",
        cause: error,
      });
    }
  }

  async getViewMetadata(viewId: string): Promise<ViewMetadata> {
    try {
      const viewMetadata = await this.viewRepository.getViewMetadata(viewId);
      
      if (!viewMetadata) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "View metadata not found",
        });
      }
      
      return viewMetadata;
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get table metadata",
        cause: error,
      });
    }
  }

  async addHiddenColumn(viewId: string, columnId: string): Promise<void> {
    try {
      await this.viewRepository.addHiddenColumn(viewId, columnId);
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to add hidden column",
        cause: error,
      });
    }
  }

  async removeHiddenColumn(viewId: string, columnId: string): Promise<void> {
    try {
      await this.viewRepository.removeHiddenColumn(viewId, columnId);
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to remove hidden column",
        cause: error,
      });
    }
  }

  async getHiddenColumns(viewId: string): Promise<string[]> {
    try {
      return await this.viewRepository.getHiddenColumns(viewId);
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get hidden columns",
        cause: error,
      });
    }
  }

  async getViewFilters(viewId: string): Promise<ViewFilter | null> {
    try {
      return await this.viewRepository.getViewFilter(viewId);
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get view filters",
        cause: error,
      });
    }
  }

  async addViewFilterCondition(viewId: string, condition: ViewFilterCondition, operator: LogicalOperatorValue = LogicalOperators.AND.value): Promise<void> {
    try {
      if (!await this.validateFilterConditionForColumnType(condition)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid filter condition for column type",
        });
      }
      
      const processedCondition = await this.roundConditionValueIfNeeded(condition);
      
      await this.viewRepository.addViewFilterCondition(viewId, processedCondition, operator);
    } catch (error) {
      // Check if this is a validation error and preserve the message
      if (error instanceof TRPCError) {
        throw error;
      }
      if (error instanceof Error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error.message,
          cause: error,
        });
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to add view filter condition",
        cause: error,
      });
    }
  }

  async removeViewFilterCondition(viewId: string, conditionIndex: number): Promise<void> {
    try {
      await this.viewRepository.removeViewFilterCondition(viewId, conditionIndex);
    } catch (error) {
      if (error instanceof Error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error.message,
          cause: error,
        });
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to remove view filter condition",
        cause: error,
      });
    }
  }

  async updateViewFilterCondition(viewId: string, conditionIndex: number, condition: ViewFilterCondition): Promise<void> {
    try {
      if (!await this.validateFilterConditionForColumnType(condition)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid filter condition for column type",
        });
      }
      
      const processedCondition = await this.roundConditionValueIfNeeded(condition);
      
      await this.viewRepository.updateViewFilterCondition(viewId, conditionIndex, processedCondition);
    } catch (error) {
      // Check if this is a validation error and preserve the message
      if (error instanceof TRPCError) {
        throw error;
      }
      if (error instanceof Error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error.message,
          cause: error,
        });
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to update view filter condition",
        cause: error,
      });
    }
  }

  async updateViewFilterOperator(viewId: string, operator: LogicalOperatorValue): Promise<void> {
    try {
      await this.viewRepository.updateViewFilterOperator(viewId, operator);
    } catch (error) {
      if (error instanceof Error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error.message,
          cause: error,
        });
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to update view filter operator",
        cause: error,
      });
    }
  }

  async validateFilterConditionForColumnType(condition: ViewFilterCondition): Promise<boolean> {
    const columnMetadata = await tableRepository.getColumnMetadata(condition.column_id);
    if (!columnMetadata) {
      return false;
    }

    const { columnType } = columnMetadata;
    const { operator } = condition;
      
    switch (columnType) {
      case ColumnTypes.Text.value:
        if (!TextFilterOperators.some(op => op.value === operator)) {
          return false;
        }
        break;
      case ColumnTypes.Number.value:
        if (!NumberFilterOperators.some(op => op.value === operator)) {
          return false;
        }
        break;
      default:
        return false;
    }
    return true;
  }

  async roundConditionValueIfNeeded(condition: ViewFilterCondition): Promise<ViewFilterCondition> {
    const columnMetadata = await tableRepository.getColumnMetadata(condition.column_id);
    if (!columnMetadata) {
      return condition;
    }

    const { columnType } = columnMetadata;
    
    if (columnType === ColumnTypes.Number.value && condition.value) {
      const numValue = parseFloat(condition.value);
      if (!isNaN(numValue)) {
        return {
          ...condition,
          value: numValue.toFixed(1)
        };
      }
    }
    
    return condition;
  }
}

export const viewService = new ViewServiceImpl(viewRepository);