import { db } from "~/server/db";


//TODO: Check to see if any route is not using
export interface TableRepository {
  findByBaseId(baseId: string): Promise<Table[]>;
  findById(id: string): Promise<Table | null>;
  create(data: CreateTableData): Promise<Table>;
  update(id: string, data: UpdateTableData): Promise<Table>;
  delete(id: string): Promise<void>;
  createWithColumnsAndRows(data: CreateTableWithDataInput): Promise<Table>;
  getTableData(id: string): Promise<TableData | null>;
  getTableRowsPaginated(id: string, cursor?: string, limit?: number): Promise<PaginatedTableData>;
  getTableMetadata(id: string): Promise<TableMetadata | null>;
  createRowsWithData(tableId: string, rows: Record<string, string>[], columns: { id: string; name: string; }[]): Promise<void>;
  addColumn(data: AddColumnData): Promise<{ id: string; name: string; columnTypeId: string; columnType: { id: string; name: string; displayName: string; }; orderIndex: number; }>;
}

export interface PaginatedTableData {
  id: string;
  rows: {
    id: string;
    [columnId: string]: string | null;
  }[];
  nextCursor?: string;
}

export interface Table {
  id: string;
  name: string;
  baseId: string;
}

export interface CreateTableData {
  name: string;
  baseId: string;
}

export interface UpdateTableData {
  name?: string;
}

export interface CreateTableWithDataInput {
  name: string;
  baseId: string;
  columns: {
    name: string;
    columnTypeId: string;
  }[];
  rows: Record<string, string>[];
}

export interface AddColumnData {
  tableId: string;
  name: string;
  columnTypeId: string;
  orderIndex: number;
}

export interface TableData {
  id: string;
  name: string;
  baseId: string;
  columns: {
    id: string;
    name: string;
    columnTypeId: string;
    columnType: {
      id: string;
      name: string;
      displayName: string;
    };
    orderIndex: number;
  }[];
  rows: {
    id: string;
    [columnId: string]: string | null;
  }[];
}

export interface TableMetadata {
  id: string;
  name: string;
  baseId: string;
  columns: {
    id: string;
    name: string;
    columnTypeId: string;
    columnType: {
      id: string;
      name: string;
      displayName: string;
    };
    orderIndex: number;
  }[];
  totalRows: number;
}

export class PrismaTableRepository implements TableRepository {
  async findByBaseId(baseId: string): Promise<Table[]> {
    return await db.table.findMany({
      where: {
        baseId,
      },
      select: {
        id: true,
        name: true,
        baseId: true,
      },
      orderBy: {
        name: "asc",
      },
    });
  }

  async findById(id: string): Promise<Table | null> {
    return await db.table.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        name: true,
        baseId: true,
      },
    });
  }

  async create(data: CreateTableData): Promise<Table> {
    return await db.table.create({
      data,
      select: {
        id: true,
        name: true,
        baseId: true,
      },
    });
  }

  async update(id: string, data: UpdateTableData): Promise<Table> {
    return await db.table.update({
      where: {
        id,
      },
      data,
      select: {
        id: true,
        name: true,
        baseId: true,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await db.table.delete({
      where: {
        id,
      },
    });
  }

  //TODO: Can be improved in performance
  async createWithColumnsAndRows(data: CreateTableWithDataInput): Promise<Table> {
    return await db.$transaction(async (tx) => {
      const table = await tx.table.create({
        data: {
          name: data.name,
          baseId: data.baseId,
        },
        select: {
          id: true,
          name: true,
          baseId: true,
        },
      });

      const columns = await Promise.all(
        data.columns.map((col, index) =>
          tx.column.create({
            data: {
              name: col.name,
              columnTypeId: col.columnTypeId,
              orderIndex: index,
              tableId: table.id,
            },
          })
        )
      );

      if (data.rows.length > 0) {
        const rowsToCreate = data.rows.map(() => ({
          tableId: table.id,
        }));
        
        await tx.row.createMany({
          data: rowsToCreate,
        });

        const createdRows = await tx.row.findMany({
          where: { tableId: table.id },
          select: { id: true },
          orderBy: { id: 'asc' },
        });

        if (createdRows.length !== data.rows.length) {
          throw new Error(`Expected ${data.rows.length} rows to be created, but got ${createdRows.length}`);
        }

        const cellsToCreate = [];
        for (let rowIndex = 0; rowIndex < data.rows.length; rowIndex++) {
          const rowData = data.rows[rowIndex];
          const createdRow = createdRows[rowIndex];
          
          if (!rowData) {
            throw new Error(`Row data at index ${rowIndex} is undefined`);
          }
          
          if (!createdRow) {
            throw new Error(`Row at index ${rowIndex} was not created properly`);
          }
          
          const rowId = createdRow.id;
          
          for (const column of columns) {
            const value = rowData[column.name] ?? null;
            cellsToCreate.push({
              rowId,
              columnId: column.id,
              tableId: table.id,
              value,
            });
          }
        }

        if (cellsToCreate.length > 0) {
          await tx.cell.createMany({
            data: cellsToCreate,
          });
        }
      }

      return table;
    }, {
      maxWait: 15000,
      timeout: 60000,
    });
  }

  async getTableData(id: string): Promise<TableData | null> {
    const table = await db.table.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        baseId: true,
        columns: {
          select: {
            id: true,
            name: true,
            columnTypeId: true,
            orderIndex: true,
            columnType: {
              select: {
                id: true,
                name: true,
                displayName: true,
              },
            },
          },
          orderBy: {
            orderIndex: "asc",
          },
        },
        rows: {
          select: {
            id: true,
            cells: {
              select: {
                columnId: true,
                value: true,
              },
            },
          },
        },
      },
    });

    if (!table) {
      return null;
    }

    // Transform the data into a more usable format for TanStack Table
    const rows = table.rows.map((row) => {
      const rowData: { id: string; [columnId: string]: string | null } = {
        id: row.id.toString(),
      };
      
      // Add cell values mapped by column ID
      row.cells.forEach((cell) => {
        rowData[cell.columnId] = cell.value;
      });
      
      return rowData;
    });

    return {
      id: table.id,
      name: table.name,
      baseId: table.baseId,
      columns: table.columns,
      rows,
    };
  }

  async getTableRowsPaginated(id: string, cursor?: string, limit = 50): Promise<PaginatedTableData> {
    const cursorId = cursor ? BigInt(cursor) : undefined;

    let rows = await db.row.findMany({
      where: {
        tableId: id,
        id: cursorId ? {
          gt: cursorId,
        } : undefined,
      },
      orderBy: {
        id: "asc",
      },
      take: limit + 1,
    });

    const hasNextPage = rows.length > limit;
    rows = hasNextPage ? rows.slice(0, -1) : rows;
    const nextCursor = hasNextPage && rows.length > 0 ? rows[rows.length - 1]?.id.toString() : undefined;

    const rowIds = rows.map(row => row.id);

    const cells = await db.cell.findMany({
      where: {
        tableId: id,
        rowId: {
          in: rowIds,
        },
      },
      select: {
        rowId: true,
        columnId: true,
        value: true,
      },
      orderBy: {
        rowId: "asc",
      },
    });

    const transformedRows = rows.map((row) => {
      const rowData: { id: string; [columnId: string]: string | null } = {
        id: row.id.toString(),
      };

      const rowCells = cells.filter(cell => cell.rowId === row.id);

      rowCells.forEach((cell) => {
        rowData[cell.columnId] = cell.value;
      });
      return rowData;
    });

    // TODO: improve the pagination object structure
    return {
      id,
      rows: transformedRows,
      nextCursor,
    };
  }

  async getTableMetadata(id: string): Promise<TableMetadata | null> {
    const table = await db.table.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        baseId: true,
        columns: {
          select: {
            id: true,
            name: true,
            columnTypeId: true,
            orderIndex: true,
            columnType: {
              select: {
                id: true,
                name: true,
                displayName: true,
              },
            },
          },
          orderBy: {
            orderIndex: "asc",
          },
        },
        _count: {
          select: {
            rows: true,
          },
        },
      },
    });

    if (!table) {
      return null;
    }

    return {
      id: table.id,
      name: table.name,
      baseId: table.baseId,
      columns: table.columns,
      totalRows: table._count.rows,
    };
  }

  async createRowsWithData(tableId: string, rows: Record<string, string>[], columns: { id: string; name: string; }[]): Promise<void> {
    if (rows.length === 0) {
      return;
    }

    await db.$transaction(async (tx) => {
      // Create rows
      const rowsToCreate = Array.from({ length: rows.length }, () => ({
        tableId,
      }));
      
      await tx.row.createMany({
        data: rowsToCreate,
      });

      // Get the newly created rows
      const createdRows = await tx.row.findMany({
        where: { tableId },
        select: { id: true },
        orderBy: { id: 'desc' },
        take: rows.length,
      });

      if (createdRows.length !== rows.length) {
        throw new Error(`Expected ${rows.length} rows to be created, but got ${createdRows.length}`);
      }

      // Create cells with the provided data
      const cellsToCreate = [];
      for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
        const rowData = rows[rowIndex];
        const createdRow = createdRows[rowIndex];
        
        if (!rowData || !createdRow) {
          throw new Error(`Row data or created row at index ${rowIndex} is undefined`);
        }
        
        for (const column of columns) {
          const value = rowData[column.name] ?? null;
          cellsToCreate.push({
            rowId: createdRow.id,
            columnId: column.id,
            tableId,
            value,
          });
        }
      }

      if (cellsToCreate.length > 0) {
        await tx.cell.createMany({
          data: cellsToCreate,
        });
      }
    }, {
      maxWait: 15000,
      timeout: 60000,
    });
  }

  async addColumn(data: AddColumnData): Promise<{ id: string; name: string; columnTypeId: string; columnType: { id: string; name: string; displayName: string; }; orderIndex: number; }> {
    return await db.$transaction(async (tx) => {
      // Check if the columnTypeId exists
      const columnType = await tx.columnType.findUnique({
        where: {
          id: data.columnTypeId,
        },
      });

      if (!columnType) {
        throw new Error(`Column type with id '${data.columnTypeId}' does not exist`);
      }

      const column = await tx.column.create({
        data: {
          name: data.name,
          columnTypeId: data.columnTypeId,
          orderIndex: data.orderIndex,
          tableId: data.tableId,
        },
        select: {
          id: true,
          name: true,
          columnTypeId: true,
          orderIndex: true,
          columnType: {
            select: {
              id: true,
              name: true,
              displayName: true,
            },
          },
        },
      });

      return column;
    });
  }
}

// Export a singleton instance
export const tableRepository = new PrismaTableRepository();