import { TRPCError } from "@trpc/server";
import { ColumnTypes, type ColumnTypeValue } from "~/data/columnTypes";
import { db } from "~/server/db";
import {
  type CellRepository,
  type Cell,
  type UpsertCellData,
  cellRepository,
} from "~/server/repositories/cell.repository";

export interface CellService {
  deleteCell(data: DeleteCellInput): Promise<void>;
  upsertCell(data: UpsertCellInput): Promise<Cell>;
}

export interface UpdateCellInput {
  rowId: string;
  columnId: string;
  value: string | null;
}

export interface DeleteCellInput {
  rowId: string;
  columnId: string;
}

export interface UpsertCellInput {
  rowId: string;
  columnId: string;
  tableId: string;
  value: string | null;
}

export interface GetPaginatedRowsInput {
  tableId: string;
  limit?: number;
  cursor?: string;
  search?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export class CellServiceImpl implements CellService {
  constructor(private readonly repository: CellRepository) {}

  private async validateCellValue(columnId: string, value: string | null): Promise<void> {
    if (value === null || value === '') {
      // Null or empty values are always allowed
      return;
    }

    // Get column type information
    const column = await db.column.findUnique({
      where: { id: columnId },
    });

    if (!column) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Column not found",
      });
    }

    const columnType = column.columnType as ColumnTypeValue;

    switch (columnType) {
      case ColumnTypes.Number.value:
        const numValue = Number(value);
        if (isNaN(numValue) || !isFinite(numValue)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Value must be a valid number for numeric columns",
          });
        }
        break;
      case ColumnTypes.Text.value:
        break;
      default:
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Unsupported column type: ${String(columnType)}`,
        });
    }
  }

  async deleteCell(data: DeleteCellInput): Promise<void> {
    const existingCell = await this.repository.findByRowAndColumn(data.rowId, data.columnId);
    
    if (!existingCell) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Cell not found",
      });
    }

    try {
      await this.repository.delete(data.rowId, data.columnId);
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to delete cell",
        cause: error,
      });
    }
  }

  async upsertCell(data: UpsertCellInput): Promise<Cell> {
    try {
      const rowExists = await db.row.findUnique({
        where: { id: BigInt(data.rowId) },
        select: { tableId: true },
      });

      if (!rowExists || rowExists.tableId !== data.tableId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid row for the specified table",
        });
      }

      const columnExists = await db.column.findUnique({
        where: { id: data.columnId },
        select: { tableId: true },
      });

      if (!columnExists || columnExists.tableId !== data.tableId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid column for the specified table",
        });
      }

      await this.validateCellValue(data.columnId, data.value);

      const upsertData: UpsertCellData = {
        tableId: data.tableId,
        value: data.value,
      };

      return await this.repository.upsert(data.rowId, data.columnId, upsertData);
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to upsert cell",
        cause: error,
      });
    }
  }
}

export const cellService = new CellServiceImpl(cellRepository);