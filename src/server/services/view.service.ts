import { TRPCError } from "@trpc/server";
import {
  type ViewRepository,
  type View,
  type ViewMetadata,
  type ViewFilter,
  type ViewFilterCondition,
  type ViewOrderingList,
  type ViewOrderingCondition,
  type CreateViewData,
  type UpdateViewData,
  viewRepository,
  type CompositeCursor,
  type PaginatedViewDataEncoded,
} from "~/server/repositories/view.repository";
import { ColumnTypes } from "~/data/columnTypes";
import { TextFilterOperators, NumberFilterOperators } from "~/data/filterOperators";
import { tableRepository } from "../repositories/table.repository";
import { LogicalOperators, type LogicalOperatorValue } from "~/data/logicalOperators";
import { CellServiceImpl } from "./cell.service";

export interface ViewService {
  listViewsByTableId(tableId: string): Promise<View[]>;
  getViewById(viewId: string): Promise<View | null>;
  createView(data: { name: string; tableId: string }): Promise<View>;
  updateView(viewId: string, data: { name: string }): Promise<View>;
  deleteView(viewId: string): Promise<void>;
  getViewRowsPaginated(viewId: string, cursor?: string, limit?: number, searchString?: string): Promise<PaginatedViewDataEncoded>;
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
  getViewOrdering(viewId: string): Promise<ViewOrderingList | null>;
  addViewOrderingCondition(viewId: string, condition: ViewOrderingCondition): Promise<void>;
  removeViewOrderingCondition(viewId: string, conditionIndex: number): Promise<void>;
  updateViewOrderingCondition(viewId: string, conditionIndex: number, condition: ViewOrderingCondition): Promise<void>;
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

  async getViewById(viewId: string): Promise<View | null> {
    try {
      return await this.viewRepository.findById(viewId);
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get view",
        cause: error,
      });
    }
  }

  async createView(data: CreateViewData): Promise<View> {
    try {
      // Validate that the table exists by checking if we can get its metadata
      const tableExists = await tableRepository.findById(data.tableId);
      if (!tableExists) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Table not found",
        });
      }
      
      return await this.viewRepository.create(data);
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create view",
        cause: error,
      });
    }
  }

  async updateView(viewId: string, data: UpdateViewData): Promise<View> {
    try {
      // Check if view exists first
      const existingView = await this.viewRepository.findById(viewId);
      if (!existingView) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "View not found",
        });
      }
      
      return await this.viewRepository.update(viewId, data);
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to update view",
        cause: error,
      });
    }
  }

  async deleteView(viewId: string): Promise<void> {
    try {
      // Check if view exists first
      const existingView = await this.viewRepository.findById(viewId);
      if (!existingView) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "View not found",
        });
      }
      
      await this.viewRepository.delete(viewId);
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to delete view",
        cause: error,
      });
    }
  }

  async getViewRowsPaginated(viewId: string, cursor?: string, limit?: number, searchString?: string): Promise<PaginatedViewDataEncoded> {
    try {
      const viewFilters = await this.viewRepository.getViewFilter(viewId);
      const viewOrdering = await this.viewRepository.getViewOrdering(viewId);
      const decodedCursor = cursor ? this.decodeCursor(cursor) ?? undefined : undefined;
      const paginatedViewData = await this.viewRepository.getViewRowsPaginated(viewId, decodedCursor, limit, viewFilters, searchString, viewOrdering);
      return {
        ...paginatedViewData,
        nextCursor: paginatedViewData.nextCursor ? this.encodeCursor(paginatedViewData.nextCursor) : undefined,
      }
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
      
      const processedCondition = await this.processViewFilterCondition(condition);
      await this.viewRepository.addViewFilterCondition(viewId, processedCondition, operator);
    } catch (error) {
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
      
      const processedCondition = await this.processViewFilterCondition(condition);
      await this.viewRepository.updateViewFilterCondition(viewId, conditionIndex, processedCondition);
    } catch (error) {
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

  async processViewFilterCondition(condition: ViewFilterCondition): Promise<ViewFilterCondition> {
    const processedCondition = condition;
    if (processedCondition.value) {
      const columnType = (await tableRepository.getColumnMetadata(processedCondition.column_id))!.columnType;
      const processedValue = CellServiceImpl.ProcessCellValue(processedCondition.value, columnType);
      processedCondition.value = CellServiceImpl.EncodeSortKey(processedValue, columnType);
    }
    return processedCondition;
  }

  async getViewOrdering(viewId: string): Promise<ViewOrderingList | null> {
    try {
      return await this.viewRepository.getViewOrdering(viewId);
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get view ordering",
        cause: error,
      });
    }
  }

  async addViewOrderingCondition(viewId: string, condition: ViewOrderingCondition): Promise<void> {
    try {
      const viewMetadata = await this.viewRepository.getViewMetadata(viewId);
      if (!viewMetadata) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "View not found",
        });
      }

      const columnExists = viewMetadata.columns.some(col => col.id === condition.column_id);
      if (!columnExists) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Column not found in view's table",
        });
      }

      await this.viewRepository.addViewOrderingCondition(viewId, condition);
    } catch (error) {
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
        message: "Failed to add view ordering condition",
        cause: error,
      });
    }
  }

  async removeViewOrderingCondition(viewId: string, conditionIndex: number): Promise<void> {
    try {
      await this.viewRepository.removeViewOrderingCondition(viewId, conditionIndex);
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
        message: "Failed to remove view ordering condition",
        cause: error,
      });
    }
  }

  async updateViewOrderingCondition(viewId: string, conditionIndex: number, condition: ViewOrderingCondition): Promise<void> {
    try {
      const viewMetadata = await this.viewRepository.getViewMetadata(viewId);
      if (!viewMetadata) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "View not found",
        });
      }

      const columnExists = viewMetadata.columns.some(col => col.id === condition.column_id);
      if (!columnExists) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Column not found in view's table",
        });
      }

      await this.viewRepository.updateViewOrderingCondition(viewId, conditionIndex, condition);
    } catch (error) {
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
        message: "Failed to update view ordering condition",
        cause: error,
      });
    }
  }

  encodeCursor(cursor: CompositeCursor): string {
    const serializable = {
      ...cursor,
      row_id: cursor.row_id.toString()
    };
    return Buffer.from(JSON.stringify(serializable)).toString('base64');
  }


  decodeCursor(cursor: string): CompositeCursor | null {
    try {
      const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
      const parsed = JSON.parse(decoded) as unknown;
      
      if (!parsed || 
          typeof parsed !== 'object' || 
          !('row_id' in parsed) || 
          !('cellValues' in parsed) ||
          !parsed.row_id ||
          !Array.isArray((parsed as { cellValues: unknown }).cellValues)) {
        return null;
      }
      
      return {
        cellValues: (parsed as { cellValues: string[] }).cellValues,
        row_id: BigInt((parsed as { row_id: string }).row_id)
      };
    } catch {
      return null;
    }
  }
}

export const viewService = new ViewServiceImpl(viewRepository);