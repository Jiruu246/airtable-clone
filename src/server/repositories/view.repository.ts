import { db } from "~/server/db";

export interface ViewRepository {
  findByTableId(tableId: string): Promise<View[]>;
  findById(id: string): Promise<View | null>;
  create(data: CreateViewData): Promise<View>;
  update(id: string, data: UpdateViewData): Promise<View>;
  delete(id: string): Promise<void>;
  getViewRowsPaginated(id: string, cursor?: string, limit?: number): Promise<PaginatedViewData>;
  getViewMetadata(id: string): Promise<ViewMetadata | null>;
  addHiddenColumn(viewId: string, columnId: string): Promise<void>;
  removeHiddenColumn(viewId: string, columnId: string): Promise<void>;
  getHiddenColumns(viewId: string): Promise<string[]>;
}

export interface View {
  id: string;
  name: string;
  tableId: string;
}

export interface CreateViewData {
  name: string;
  tableId: string;
}

export interface UpdateViewData {
  name?: string;
}

export interface PaginatedViewData {
  id: string;
  rows: {
    id: string;
    [columnId: string]: string | null;
  }[];
  nextCursor?: string;
}

export interface ViewMetadata {
  id: string;
  name: string;
  tableId: string;
  table: {
    id: string;
    name: string;
    baseId: string;
  };
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

export class PrismaViewRepository implements ViewRepository {
  async findByTableId(tableId: string): Promise<View[]> {
    return await db.view.findMany({
      where: {
        tableId,
      },
      select: {
        id: true,
        name: true,
        tableId: true,
      },
      orderBy: {
        name: "asc",
      },
    });
  }

  async findById(id: string): Promise<View | null> {
    return await db.view.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        name: true,
        tableId: true,
      },
    });
  }

  async create(data: CreateViewData): Promise<View> {
    return await db.view.create({
      data,
      select: {
        id: true,
        name: true,
        tableId: true,
      },
    });
  }

  async update(id: string, data: UpdateViewData): Promise<View> {
    return await db.view.update({
      where: {
        id,
      },
      data,
      select: {
        id: true,
        name: true,
        tableId: true,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await db.view.delete({
      where: {
        id,
      },
    });
  }

  async getViewRowsPaginated(id: string, cursor?: string, limit = 50): Promise<PaginatedViewData> {
    const view = await db.view.findUnique({
      where: { id },
      select: { tableId: true },
    });

    if (!view) {
      throw new Error(`View with id ${id} not found`);
    }

    const cursorId = cursor ? BigInt(cursor) : undefined;

    let rows = await db.row.findMany({
      where: {
        tableId: view.tableId,
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
        tableId: view.tableId,
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

    return {
      id,
      rows: transformedRows,
      nextCursor,
    };
  }

  async getViewMetadata(id: string): Promise<ViewMetadata | null> {
    const view = await db.view.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        tableId: true,
        table: {
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
        },
      },
    });

    if (!view) {
      return null;
    }

    return {
      id: view.id,
      name: view.name,
      tableId: view.tableId,
      table: view.table,
      columns: view.table.columns,
      totalRows: view.table._count.rows,
    };
  }

  async addHiddenColumn(viewId: string, columnId: string): Promise<void> {
    // Check if view exists
    const view = await db.view.findUnique({
      where: { id: viewId },
      select: { id: true },
    });

    if (!view) {
      throw new Error(`View with id ${viewId} not found`);
    }

    // Get existing hidden columns configuration
    const existingConf = await db.viewConf.findUnique({
      where: {
        viewId_key: {
          viewId,
          key: "hiddenColumns",
        },
      },
    });

    let hiddenColumns: string[] = [];
    if (existingConf) {
      // Parse existing configuration
      const confData = existingConf.confJson as { columnIds: string[] };
      hiddenColumns = confData.columnIds || [];
    }

    // Add column if not already hidden
    if (!hiddenColumns.includes(columnId)) {
      hiddenColumns.push(columnId);

      // Update or create the configuration
      await db.viewConf.upsert({
        where: {
          viewId_key: {
            viewId,
            key: "hiddenColumns",
          },
        },
        create: {
          viewId,
          key: "hiddenColumns",
          confJson: { columnIds: hiddenColumns },
        },
        update: {
          confJson: { columnIds: hiddenColumns },
        },
      });
    }
  }

  async removeHiddenColumn(viewId: string, columnId: string): Promise<void> {
    // Check if view exists
    const view = await db.view.findUnique({
      where: { id: viewId },
      select: { id: true },
    });

    if (!view) {
      throw new Error(`View with id ${viewId} not found`);
    }

    // Get existing hidden columns configuration
    const existingConf = await db.viewConf.findUnique({
      where: {
        viewId_key: {
          viewId,
          key: "hiddenColumns",
        },
      },
    });

    if (existingConf) {
      const confData = existingConf.confJson as { columnIds: string[] };
      const hiddenColumns = (confData.columnIds || []).filter(id => id !== columnId);

      if (hiddenColumns.length === 0) {
        // Remove the configuration if no hidden columns remain
        await db.viewConf.delete({
          where: {
            viewId_key: {
              viewId,
              key: "hiddenColumns",
            },
          },
        });
      } else {
        // Update the configuration
        await db.viewConf.update({
          where: {
            viewId_key: {
              viewId,
              key: "hiddenColumns",
            },
          },
          data: {
            confJson: { columnIds: hiddenColumns },
          },
        });
      }
    }
  }

  async getHiddenColumns(viewId: string): Promise<string[]> {
    const existingConf = await db.viewConf.findUnique({
      where: {
        viewId_key: {
          viewId,
          key: "hiddenColumns",
        },
      },
    });

    if (existingConf) {
      const confData = existingConf.confJson as { columnIds: string[] };
      return confData.columnIds || [];
    }

    return [];
  }
}

// Export a singleton instance
export const viewRepository = new PrismaViewRepository();