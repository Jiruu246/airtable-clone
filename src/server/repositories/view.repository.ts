import { Prisma } from "../../../generated/prisma";
import type { ColumnTypeValue } from "~/data/columnTypes";
import { FilterOperators, type FilterOperatorValue } from "~/data/filterOperators";
import { LogicalOperators, type LogicalOperatorValue } from "~/data/logicalOperators";
import { db } from "~/server/db";

export interface ViewRepository {
  findByTableId(tableId: string): Promise<View[]>;
  findById(id: string): Promise<View | null>;
  create(data: CreateViewData): Promise<View>;
  update(id: string, data: UpdateViewData): Promise<View>;
  delete(id: string): Promise<void>;
  getViewRowsPaginated(id: string, cursor?: string, limit?: number, viewFilters?: ViewFilter | null, searchString?: string): Promise<PaginatedViewData>;
  getViewMetadata(id: string): Promise<ViewMetadata | null>;
  addHiddenColumn(viewId: string, columnId: string): Promise<void>;
  removeHiddenColumn(viewId: string, columnId: string): Promise<void>;
  getHiddenColumns(viewId: string): Promise<string[]>;
  getViewFilter(viewId: string): Promise<ViewFilter | null>;
  addViewFilterCondition(viewId: string, condition: ViewFilterCondition, operator?: LogicalOperatorValue): Promise<void>;
  removeViewFilterCondition(viewId: string, conditionIndex: number): Promise<void>;
  updateViewFilterCondition(viewId: string, conditionIndex: number, condition: ViewFilterCondition): Promise<void>;
  updateViewFilterOperator(viewId: string, operator: LogicalOperatorValue): Promise<void>;
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
    columnType: ColumnTypeValue;
    orderIndex: number;
  }[];
  totalRows: number;
}

export interface ViewFilterCondition {
  column_id: string;
  operator: FilterOperatorValue;
  value: string | null;
}

export interface ViewFilter {
  operator: LogicalOperatorValue;
  conditions: ViewFilterCondition[];
}

function buildFilterConditionSql(condition: ViewFilterCondition): Prisma.Sql {
  const { column_id, operator, value } = condition;

  if (value === null && operator !== 'is_empty' && operator !== 'is_not_empty') {
    return Prisma.sql`TRUE`;
  }

  switch (operator) {
    case FilterOperators.Contains.value:
      return Prisma.sql`EXISTS (
        SELECT 1 FROM "Cell" c 
        WHERE c."row_id" = r."id" 
          AND c."column_id" = ${column_id}
          AND c."value" ILIKE ${`%${value}%`}
      )`;
    case FilterOperators.NotContains.value:
      return Prisma.sql`NOT EXISTS (
        SELECT 1 FROM "Cell" c 
        WHERE c."row_id" = r."id" 
          AND c."column_id" = ${column_id}
          AND c."value" ILIKE ${`%${value}%`}
      ) OR NOT EXISTS (
        SELECT 1 FROM "Cell" c 
        WHERE c."row_id" = r."id" 
          AND c."column_id" = ${column_id}
      )`;
    case FilterOperators.Is.value:
      return Prisma.sql`EXISTS (
        SELECT 1 FROM "Cell" c 
        WHERE c."row_id" = r."id" 
          AND c."column_id" = ${column_id}
          AND c."value" = ${value}
      )`;
    case FilterOperators.IsNot.value:
      return Prisma.sql`(
        EXISTS (
          SELECT 1 FROM "Cell" c 
          WHERE c."row_id" = r."id" 
            AND c."column_id" = ${column_id}
            AND c."value" != ${value}
        ) OR NOT EXISTS (
          SELECT 1 FROM "Cell" c 
          WHERE c."row_id" = r."id" 
            AND c."column_id" = ${column_id}
        )
      )`;
    case FilterOperators.IsEmpty.value:
      return Prisma.sql`NOT EXISTS (
        SELECT 1 FROM "Cell" c 
        WHERE c."row_id" = r."id" 
          AND c."column_id" = ${column_id}
          AND c."value" IS NOT NULL
          AND c."value" != ''
      )`;
    case FilterOperators.IsNotEmpty.value:
      return Prisma.sql`EXISTS (
        SELECT 1 FROM "Cell" c 
        WHERE c."row_id" = r."id" 
          AND c."column_id" = ${column_id}
          AND c."value" IS NOT NULL
          AND c."value" != ''
      )`;
    case FilterOperators.Equal.value:
      return Prisma.sql`EXISTS (
        SELECT 1 FROM "Cell" c 
        WHERE c."row_id" = r."id" 
          AND c."column_id" = ${column_id}
          AND c."value"::numeric = ${value}::numeric
      )`;
    case FilterOperators.NotEqual.value:
      return Prisma.sql`(
        EXISTS (
          SELECT 1 FROM "Cell" c 
          WHERE c."row_id" = r."id" 
            AND c."column_id" = ${column_id}
            AND c."value"::numeric != ${value}::numeric
        ) OR NOT EXISTS (
          SELECT 1 FROM "Cell" c 
          WHERE c."row_id" = r."id" 
            AND c."column_id" = ${column_id}
        )
      )`;
    case FilterOperators.GreaterThan.value:
      return Prisma.sql`EXISTS (
        SELECT 1 FROM "Cell" c 
        WHERE c."row_id" = r."id" 
          AND c."column_id" = ${column_id}
          AND c."value"::numeric > ${value}::numeric
      )`;
    case FilterOperators.LessThan.value:
      return Prisma.sql`EXISTS (
        SELECT 1 FROM "Cell" c 
        WHERE c."row_id" = r."id" 
          AND c."column_id" = ${column_id}
          AND c."value"::numeric < ${value}::numeric
      )`;
    case FilterOperators.GreaterThanEqual.value:
      return Prisma.sql`EXISTS (
        SELECT 1 FROM "Cell" c 
        WHERE c."row_id" = r."id" 
          AND c."column_id" = ${column_id}
          AND c."value"::numeric >= ${value}::numeric
      )`;
    case FilterOperators.LessThanEqual.value:
      return Prisma.sql`EXISTS (
        SELECT 1 FROM "Cell" c 
        WHERE c."row_id" = r."id" 
          AND c."column_id" = ${column_id}
          AND c."value"::numeric <= ${value}::numeric
      )`;
    default:
      return Prisma.sql`TRUE`;
  }
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

  async getViewRowsPaginated(id: string, cursor?: string, limit = 50, viewFilters?: ViewFilter | null, searchString?: string): Promise<PaginatedViewData> {
    const view = await db.view.findUnique({
      where: { id },
      select: { tableId: true },
    });

    if (!view) {
      throw new Error(`View with id ${id} not found`);
    }

    const cursorId = cursor ? BigInt(cursor) : undefined;

    const whereConditions: Prisma.Sql[] = [Prisma.sql`r."table_id" = ${view.tableId}`];

    if (cursorId !== undefined) {
      whereConditions.push(Prisma.sql`r."id" > ${cursorId}`);
    }

    if (viewFilters && viewFilters.conditions.length > 0) {
      const filterConditions = viewFilters.conditions.map(buildFilterConditionSql);

      if (viewFilters.operator === LogicalOperators.OR.value) {
        const combinedFilters = Prisma.join(filterConditions, ' OR ');
        whereConditions.push(Prisma.sql`(${combinedFilters})`);
      } else {
        filterConditions.forEach(condition => {
          whereConditions.push(Prisma.sql`(${condition})`);
        });
      }
    }

    if (searchString && searchString.trim() !== '') {
      whereConditions.push(Prisma.sql`EXISTS (
        SELECT 1 FROM "Cell" c
        WHERE c."row_id" = r."id"
          AND c."value" ILIKE ${`%${searchString}%`}
      )`);
    }

    const whereClause = whereConditions.length > 0 
      ? Prisma.join(whereConditions, ' AND ') 
      : Prisma.sql`TRUE`;

    const rows = await db.$queryRaw<Array<{ id: bigint; table_id: string }>>`
      SELECT r."id", r."table_id" 
      FROM "Row" r
      WHERE ${whereClause}
      ORDER BY r."id" ASC 
      LIMIT ${limit + 1}
    `;

    const hasNextPage = rows.length > limit;
    const paginatedRows = hasNextPage ? rows.slice(0, -1) : rows;
    const nextCursor = hasNextPage && paginatedRows.length > 0 ? paginatedRows[paginatedRows.length - 1]?.id.toString() : undefined;

    const rowIds = paginatedRows.map(row => row.id);

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

    const transformedRows = paginatedRows.map((row) => {
      const rowData: { id: string;[columnId: string]: string | null } = {
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
                columnType: true,
                orderIndex: true,
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
      columns: view.table.columns.map((col) => ({
        id: col.id,
        name: col.name,
        columnType: col.columnType as unknown as ColumnTypeValue,
        orderIndex: col.orderIndex,
      })),
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
      const confData = existingConf.confJson as { columnType: string[] };
      hiddenColumns = confData.columnType || [];
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
          confJson: { columnType: hiddenColumns },
        },
        update: {
          confJson: { columnType: hiddenColumns },
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



  async getViewFilter(viewId: string): Promise<ViewFilter | null> {
    const existingConf = await db.viewConf.findUnique({
      where: {
        viewId_key: {
          viewId,
          key: "filters",
        },
      },
    });

    if (existingConf) {
      const confData = existingConf.confJson as unknown as ViewFilter;
      return confData || null;
    }

    return null;
  }

  async addViewFilterCondition(viewId: string, condition: ViewFilterCondition, operator: LogicalOperatorValue = LogicalOperators.AND.value): Promise<void> {
    // Check if view exists
    const view = await db.view.findUnique({
      where: { id: viewId },
      select: { id: true },
    });

    if (!view) {
      throw new Error(`View with id ${viewId} not found`);
    }

    // Get existing filters configuration
    const existingConf = await db.viewConf.findUnique({
      where: {
        viewId_key: {
          viewId,
          key: "filters",
        },
      },
    });

    let filters: ViewFilter;
    if (existingConf) {
      // Parse existing configuration
      const confData = existingConf.confJson as unknown as ViewFilter;
      filters = confData || { operator: LogicalOperators.AND.value, conditions: [] };

      // Check if operator matches existing operator
      if (filters.operator !== operator) {
        throw new Error(`Filter operator mismatch. Expected ${filters.operator} but got ${operator}`);
      }
    } else {
      // Create new filter structure with default operator
      filters = {
        operator,
        conditions: []
      };
    }

    // Add new condition
    filters.conditions.push(condition);

    // Update or create the configuration
    await db.viewConf.upsert({
      where: {
        viewId_key: {
          viewId,
          key: "filters",
        },
      },
      create: {
        viewId,
        key: "filters",
        confJson: filters as unknown as Prisma.InputJsonValue,
      },
      update: {
        confJson: filters as unknown as Prisma.InputJsonValue,
      },
    });
  }

  async removeViewFilterCondition(viewId: string, conditionIndex: number): Promise<void> {
    const view = await db.view.findUnique({
      where: { id: viewId },
      select: { id: true },
    });

    if (!view) {
      throw new Error(`View with id ${viewId} not found`);
    }

    const existingConf = await db.viewConf.findUnique({
      where: {
        viewId_key: {
          viewId,
          key: "filters",
        },
      },
    });

    if (existingConf) {
      const confData = existingConf.confJson as unknown as ViewFilter;
      const filters = confData;

      if (!filters?.conditions) {
        return;
      }

      if (conditionIndex < 0 || conditionIndex >= filters.conditions.length) {
        throw new Error(`Invalid condition index: ${conditionIndex}`);
      }

      filters.conditions.splice(conditionIndex, 1);

      if (filters.conditions.length === 0) {
        await db.viewConf.delete({
          where: {
            viewId_key: {
              viewId,
              key: "filters",
            },
          },
        });
      } else {
        await db.viewConf.update({
          where: {
            viewId_key: {
              viewId,
              key: "filters",
            },
          },
          data: {
            confJson: filters as unknown as Prisma.InputJsonValue,
          },
        });
      }
    }
  }

  async updateViewFilterCondition(viewId: string, conditionIndex: number, condition: ViewFilterCondition): Promise<void> {
    // Check if view exists
    const view = await db.view.findUnique({
      where: { id: viewId },
      select: { id: true },
    });

    if (!view) {
      throw new Error(`View with id ${viewId} not found`);
    }

    // Get existing filters configuration
    const existingConf = await db.viewConf.findUnique({
      where: {
        viewId_key: {
          viewId,
          key: "filters",
        },
      },
    });

    if (!existingConf) {
      throw new Error(`No filters configuration found for view ${viewId}`);
    }

    const confData = existingConf.confJson as unknown as ViewFilter;
    const filters = confData;

    if (!filters?.conditions) {
      throw new Error(`No filters found for view ${viewId}`);
    }

    // Check if index is valid
    if (conditionIndex < 0 || conditionIndex >= filters.conditions.length) {
      throw new Error(`Invalid condition index: ${conditionIndex}`);
    }

    // Update condition at specified index
    filters.conditions[conditionIndex] = condition;

    // Update the configuration
    await db.viewConf.update({
      where: {
        viewId_key: {
          viewId,
          key: "filters",
        },
      },
      data: {
        confJson: filters as unknown as Prisma.InputJsonValue,
      },
    });
  }

  async updateViewFilterOperator(viewId: string, operator: LogicalOperatorValue): Promise<void> {
    const view = await db.view.findUnique({
      where: { id: viewId },
      select: { id: true },
    });

    if (!view) {
      throw new Error(`View with id ${viewId} not found`);
    }

    const existingConf = await db.viewConf.findUnique({
      where: {
        viewId_key: {
          viewId,
          key: "filters",
        },
      },
    });

    if (!existingConf) {
      throw new Error(`No filters configuration found for view ${viewId}`);
    }

    const confData = existingConf.confJson as unknown as ViewFilter;
    const filters = confData;

    if (!filters) {
      throw new Error(`No filters found for view ${viewId}`);
    }

    filters.operator = operator;

    await db.viewConf.update({
      where: {
        viewId_key: {
          viewId,
          key: "filters",
        },
      },
      data: {
        confJson: filters as unknown as Prisma.InputJsonValue,
      },
    });
  }
}

export const viewRepository = new PrismaViewRepository();