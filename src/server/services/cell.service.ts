import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import {
  type CellRepository,
  type Cell,
  type UpsertCellData,
  type PaginatedTableData,
  type GetPaginatedRowsParams,
  cellRepository,
} from "~/server/repositories/cell.repository";

export interface CellService {
  deleteCell(data: DeleteCellInput): Promise<void>;
  upsertCell(data: UpsertCellInput): Promise<Cell>;
  getPaginatedRows(params: GetPaginatedRowsInput): Promise<PaginatedTableData>;
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
      select: {
        columnType: {
          select: { id: true }
        }
      }
    });

    if (!column) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Column not found",
      });
    }

    const columnTypeId = column.columnType.id;

    switch (columnTypeId) {
      case 'NUM':
        // Validate that the value is a valid number
        const numValue = Number(value);
        if (isNaN(numValue) || !isFinite(numValue)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Value must be a valid number for numeric columns",
          });
        }
        break;
      case 'TXT':
        // Text columns accept any string value, no validation needed
        break;
      default:
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Unsupported column type: ${columnTypeId}`,
        });
    }
  }

  async deleteCell(data: DeleteCellInput): Promise<void> {
    // Check if the cell exists
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
    // Validate that row and column exist by checking if there's a valid combination
    // This helps prevent creating orphaned cells
    try {
      // First verify the row exists
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

      // Verify the column exists and belongs to the same table
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

      // Validate the cell value against column type constraints
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

  async getPaginatedRows(params: GetPaginatedRowsInput): Promise<PaginatedTableData> {
    // Validate table exists
    // TODO: access db directlt??
    const tableExists = await db.table.findUnique({
      where: { id: params.tableId },
      select: { id: true },
    });

    if (!tableExists) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Table not found",
      });
    }

    try {
      const repositoryParams: GetPaginatedRowsParams = {
        tableId: params.tableId,
        limit: params.limit ?? 50,
        cursor: params.cursor,
        search: params.search,
        sortBy: params.sortBy ?? 'id',
        sortDirection: params.sortDirection ?? 'asc',
      };

      return await this.repository.getPaginatedRows(repositoryParams);
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch paginated rows",
        cause: error,
      });
    }
  }
}

export const cellService = new CellServiceImpl(cellRepository);