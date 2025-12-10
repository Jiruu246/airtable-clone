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
  value: string;
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
  // Constants for numeric value limits (18 integer digits + 1 decimal digit)
  private static readonly MAX_NUMERIC_VALUE = 999999999999999999.9;
  private static readonly MIN_NUMERIC_VALUE = -999999999999999999.9;
  private static readonly SORT_KEY_LENGTH = 20;

  constructor(private readonly repository: CellRepository) {}

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

      const columnType = (await db.column.findUnique({
        where: { id: data.columnId },
      }))?.columnType as ColumnTypeValue;

      let processedValue = data.value;

      if (columnType === ColumnTypes.Number.value) {
        let numValue = Number(data.value);
        if (!isNaN(numValue) && isFinite(numValue)) {
          numValue = Math.max(CellServiceImpl.MIN_NUMERIC_VALUE, Math.min(CellServiceImpl.MAX_NUMERIC_VALUE, numValue));
          processedValue = String(Math.round(numValue * 10) / 10);
        } else {
          processedValue = '0';
        }
      }

      const upsertData: UpsertCellData = {
        tableId: data.tableId,
        value: processedValue,
        sort_key: CellServiceImpl.EncodeSortKey(processedValue, columnType),
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

  static EncodeSortKey(value: string, columnType: ColumnTypeValue): string {
    switch (columnType) {
      case ColumnTypes.Number.value:
        return CellServiceImpl.GenerateNumberSortKey(value);
      case ColumnTypes.Text.value:
        return value.toLowerCase().trim();
      default:
        return value.toLowerCase().trim();
    }
  }

  private static GenerateNumberSortKey(value: string): string {
    const numValue = Number(value);
    if (isNaN(numValue) || !isFinite(numValue)) {
      return '0'.padEnd(CellServiceImpl.SORT_KEY_LENGTH, '0');
    }

    const clampedValue = Math.max(CellServiceImpl.MIN_NUMERIC_VALUE, Math.min(CellServiceImpl.MAX_NUMERIC_VALUE, numValue));
    const roundedValue = Math.round(clampedValue * 10) / 10;
    
    const signFlag = roundedValue >= 0 ? '1' : '0';
    
    const absValue = Math.abs(roundedValue);
    const integerPart = Math.floor(absValue);
    const decimalPart = Math.round((absValue - integerPart) * 10);
    
    let paddedInteger: string;
    let sortDecimal: string;
    
    if (roundedValue >= 0) {
      paddedInteger = integerPart.toString().padStart(18, '0');
      sortDecimal = decimalPart.toString();
    } else {
      const maxInteger = Math.pow(10, 18) - 1; // 999999999999999999
      const invertedInteger = (maxInteger - integerPart).toString().padStart(18, '0');
      const invertedDecimal = (9 - decimalPart).toString();
      paddedInteger = invertedInteger;
      sortDecimal = invertedDecimal;
    }
    
    const result = signFlag + paddedInteger + sortDecimal;
    if (result.length > CellServiceImpl.SORT_KEY_LENGTH) {
      throw new Error('Generated sort key exceeds fixed length');
    }

    return result;
  }
}

export const cellService = new CellServiceImpl(cellRepository);