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
    type: string;
    orderIndex: number;
  }[];
  rows: Record<string, string>[];
}

export interface TableData {
  id: string;
  name: string;
  baseId: string;
  columns: {
    id: string;
    name: string;
    type: string;
    orderIndex: number;
  }[];
  rows: {
    id: string;
    [columnId: string]: string | null;
  }[];
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
        data.columns.map((col) =>
          tx.column.create({
            data: {
              name: col.name,
              type: col.type,
              orderIndex: col.orderIndex,
              tableId: table.id,
            },
          })
        )
      );

      if (data.rows.length > 0) {
        for (const rowData of data.rows) {
          const row = await tx.row.create({
            data: {
              tableId: table.id,
            },
          });

          for (const column of columns) {
            const value = rowData[column.name] ?? null;
            await tx.cell.create({
              data: {
                rowId: row.id,
                columnId: column.id,
                tableId: table.id,
                value,
              },
            });
          }
        }
      }

      return table;
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
            type: true,
            orderIndex: true,
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
}

// Export a singleton instance
export const tableRepository = new PrismaTableRepository();