import { db } from "~/server/db";

export interface CellRepository {
  findByRowAndColumn(rowId: string, columnId: string): Promise<Cell | null>;
  update(rowId: string, columnId: string, data: UpdateCellData): Promise<Cell>;
  delete(rowId: string, columnId: string): Promise<void>;
  upsert(rowId: string, columnId: string, data: UpsertCellData): Promise<Cell>;
  getPaginatedRows(params: GetPaginatedRowsParams): Promise<PaginatedTableData>;
}

export interface Cell {
  rowId: string;
  columnId: string;
  tableId: string;
  value: string | null;
}

export interface UpdateCellData {
  value: string | null;
}

export interface UpsertCellData {
  tableId: string;
  value: string | null;
}

export interface PaginatedTableData {
  rows: RowData[];
  nextCursor?: string;
  hasMore: boolean;
  totalCount: number;
}

export interface RowData {
  id: string;
  cells: Record<string, string | null>;
}

export interface GetPaginatedRowsParams {
  tableId: string;
  limit?: number;
  cursor?: string;
  search?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export class PrismaCellRepository implements CellRepository {
  async findByRowAndColumn(rowId: string, columnId: string): Promise<Cell | null> {
    const cell = await db.cell.findUnique({
      where: {
        rowId_columnId: {
          rowId: BigInt(rowId),
          columnId,
        },
      },
    });

    if (!cell) {
      return null;
    }

    return {
      rowId: cell.rowId.toString(),
      columnId: cell.columnId,
      tableId: cell.tableId,
      value: cell.value,
    };
  }

  async update(rowId: string, columnId: string, data: UpdateCellData): Promise<Cell> {
    const cell = await db.cell.update({
      where: {
        rowId_columnId: {
          rowId: BigInt(rowId),
          columnId,
        },
      },
      data: {
        value: data.value,
      },
    });

    return {
      rowId: cell.rowId.toString(),
      columnId: cell.columnId,
      tableId: cell.tableId,
      value: cell.value,
    };
  }

  async delete(rowId: string, columnId: string): Promise<void> {
    await db.cell.delete({
      where: {
        rowId_columnId: {
          rowId: BigInt(rowId),
          columnId,
        },
      },
    });
  }

  async upsert(rowId: string, columnId: string, data: UpsertCellData): Promise<Cell> {
    const cell = await db.cell.upsert({
      where: {
        rowId_columnId: {
          rowId: BigInt(rowId),
          columnId,
        },
      },
      update: {
        value: data.value,
      },
      create: {
        rowId: BigInt(rowId),
        columnId,
        tableId: data.tableId,
        value: data.value,
      },
    });

    return {
      rowId: cell.rowId.toString(),
      columnId: cell.columnId,
      tableId: cell.tableId,
      value: cell.value,
    };
  }

  async getPaginatedRows(params: GetPaginatedRowsParams): Promise<PaginatedTableData> {
    const {
      tableId,
      limit = 50,
      cursor,
      search,
      sortBy = 'id',
      sortDirection = 'asc'
    } = params;

    // Build where clause for search and cursor
    const whereClause: {
      tableId: string;
      id?: { gt: bigint } | { lt: bigint };
    } = {
      tableId,
    };

    // Add cursor condition for pagination
    if (cursor) {
      const cursorId = BigInt(cursor);
      whereClause.id = sortDirection === 'asc' 
        ? { gt: cursorId }
        : { lt: cursorId };
    }

    // Add search condition if provided
    let searchWhereClause = undefined;
    if (search?.trim()) {
      searchWhereClause = {
        cells: {
          some: {
            value: {
              contains: search.trim(),
              mode: 'insensitive' as const,
            },
          },
        },
      };
    }

    // Get total count for hasMore calculation
    const totalCount = await db.row.count({
      where: {
        ...whereClause,
        ...searchWhereClause,
      },
    });

    // Fetch rows with cells
    const rows = await db.row.findMany({
      where: {
        ...whereClause,
        ...searchWhereClause,
      },
      include: {
        cells: {
          select: {
            columnId: true,
            value: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortDirection,
      },
      take: limit + 1, // Take one more to check if there are more results
    });

    // Check if there are more results
    const hasMore = rows.length > limit;
    const resultRows = hasMore ? rows.slice(0, limit) : rows;

    // Get next cursor
    const nextCursor = hasMore && resultRows.length > 0
      ? resultRows[resultRows.length - 1]?.id.toString()
      : undefined;

    // Transform rows to the expected format
    const transformedRows: RowData[] = resultRows.map((row) => {
      const cells: Record<string, string | null> = {};
      
      row.cells.forEach((cell) => {
        cells[cell.columnId] = cell.value;
      });

      return {
        id: row.id.toString(),
        cells,
      };
    });

    return {
      rows: transformedRows,
      nextCursor,
      hasMore,
      totalCount,
    };
  }
}

// Export a singleton instance
export const cellRepository = new PrismaCellRepository();