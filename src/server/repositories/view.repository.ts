import { Prisma } from "../../../generated/prisma";
import type { ColumnTypeValue } from "~/data/columnTypes";
import { FilterOperators, type FilterOperatorValue } from "~/data/filterOperators";
import { LogicalOperators, type LogicalOperatorValue } from "~/data/logicalOperators";
import { OrderDirections, type OrderDirectionValue } from "~/data/orderingType";
import { db } from "~/server/db";

export interface ViewRepository {
  findByTableId(tableId: string): Promise<View[]>;
  findById(id: string): Promise<View | null>;
  create(data: CreateViewData): Promise<View>;
  update(id: string, data: UpdateViewData): Promise<View>;
  delete(id: string): Promise<void>;
  getViewRowsPaginated(
    id: string, 
    cursor?: CompositeCursor, 
    limit?: number, 
    viewFilters?: ViewFilter | null, 
    searchString?: string, 
    viewOrdering?: ViewOrderingList | null
  ): Promise<PaginatedViewData>;
  getViewMetadata(id: string): Promise<ViewMetadata | null>;
  addHiddenColumn(viewId: string, columnId: string): Promise<void>;
  removeHiddenColumn(viewId: string, columnId: string): Promise<void>;
  getHiddenColumns(viewId: string): Promise<string[]>;
  getViewFilter(viewId: string): Promise<ViewFilter | null>;
  addViewFilterCondition(viewId: string, condition: ViewFilterCondition, operator?: LogicalOperatorValue): Promise<void>;
  removeViewFilterCondition(viewId: string, conditionIndex: number): Promise<void>;
  updateViewFilterCondition(viewId: string, conditionIndex: number, condition: ViewFilterCondition): Promise<void>;
  updateViewFilterOperator(viewId: string, operator: LogicalOperatorValue): Promise<void>;
  getViewOrdering(viewId: string): Promise<ViewOrderingList | null>;
  addViewOrderingCondition(viewId: string, condition: ViewOrderingCondition): Promise<void>;
  removeViewOrderingCondition(viewId: string, conditionIndex: number): Promise<void>;
  updateViewOrderingCondition(viewId: string, conditionIndex: number, condition: ViewOrderingCondition): Promise<void>;
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
  nextCursor?: CompositeCursor;
}

export interface PaginatedViewDataEncoded {
  id: string;
  rows: {
    id: string;
    [columnId: string]: string | null;
  }[];
  nextCursor?: string;
} 

export interface CompositeCursor {
  cellValues: string[];
  row_id: bigint;
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

export interface ViewOrderingCondition {
  column_id: string;
  direction: OrderDirectionValue;
}

export interface ViewOrderingList {
  conditions: ViewOrderingCondition[];
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
          AND c."sort_key" = ${value}
      )`;
    case FilterOperators.NotEqual.value:
      return Prisma.sql`(
        EXISTS (
          SELECT 1 FROM "Cell" c 
          WHERE c."row_id" = r."id" 
            AND c."column_id" = ${column_id}
            AND c."sort_key" != ${value}
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
          AND c."sort_key" > ${value}
      )`;
    case FilterOperators.LessThan.value:
      return Prisma.sql`EXISTS (
        SELECT 1 FROM "Cell" c 
        WHERE c."row_id" = r."id" 
          AND c."column_id" = ${column_id}
          AND c."sort_key" < ${value}
      )`;
    case FilterOperators.GreaterThanEqual.value:
      return Prisma.sql`EXISTS (
        SELECT 1 FROM "Cell" c 
        WHERE c."row_id" = r."id" 
          AND c."column_id" = ${column_id}
          AND c."sort_key" >= ${value}
      )`;
    case FilterOperators.LessThanEqual.value:
      return Prisma.sql`EXISTS (
        SELECT 1 FROM "Cell" c 
        WHERE c."row_id" = r."id" 
          AND c."column_id" = ${column_id}
          AND c."sort_key" <= ${value}
      )`;
    default:
      return Prisma.sql`TRUE`;
  }
}

export class PrismaViewRepository implements ViewRepository {
  private buildWhereClause(
    tableId: string,
    cursor?: CompositeCursor,
    viewOrdering?: ViewOrderingList | null,
    viewFilters?: ViewFilter | null,
    searchString?: string
  ): Prisma.Sql {
    const whereConditions: Prisma.Sql[] = [Prisma.sql`r."table_id" = ${tableId}`];

    if (cursor) {
      const cursorCondition = this.buildCursorCondition(cursor, viewOrdering);
      whereConditions.push(cursorCondition);
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

    return Prisma.join(whereConditions, ' AND ');
  }

  private buildCursorCondition(
    cursor: CompositeCursor,
    viewOrdering?: ViewOrderingList | null
  ): Prisma.Sql {
    if (!viewOrdering?.conditions?.length || !cursor?.cellValues?.length) {
      const cursorId = BigInt(cursor.row_id);
      return Prisma.sql`r."id" > ${cursorId}`;
    }
    
    const conditions = viewOrdering.conditions;
    const cursorValues = cursor.cellValues;
    const cursorRowId = cursor.row_id;
    
    const firstDirection = conditions[0]!.direction;
    const sameDirection = conditions.every(c => c.direction === firstDirection);
    
    if (sameDirection) {
      return this.buildTupleComparison(conditions, cursorValues, cursorRowId);
    } else {
      return this.buildMixComparison(conditions, cursorValues, cursorRowId);
    }
  }

  private buildTupleComparison(
    conditions: ViewOrderingCondition[],
    cursorValues: string[],
    cursorRowId: bigint
  ): Prisma.Sql {
    const isAscending = conditions[0]!.direction === OrderDirections.Ascending.value;
    const operator = isAscending ? Prisma.sql`>` : Prisma.sql`<`;
    
    const leftTuple: Prisma.Sql[] = Array.from({ length: conditions.length }, (_, index) => {
      const alias = `order_cell_${index}`;
      return Prisma.sql`COALESCE(${Prisma.raw(alias)}."sort_key", '')`;
    });
    leftTuple.push(Prisma.sql`r."id"`);
    const leftSide = Prisma.join(leftTuple, ', ');
    
    const rightTuple: Prisma.Sql[] = Array.from({ length: conditions.length }, (_, index) => {
      return Prisma.sql`${cursorValues[index]}`;
    });
    rightTuple.push(Prisma.sql`${cursorRowId}`);
    const rightSide = Prisma.join(rightTuple, ', ');
    
    return Prisma.sql`(${leftSide}) ${operator} (${rightSide})`;
  }

  private buildMixComparison(
    conditions: ViewOrderingCondition[],
    cursorValues: string[],
    cursorRowId: bigint
  ): Prisma.Sql {
    const orConditions: Prisma.Sql[] = [];
    
    for (let i = 0; i < conditions.length; i++) {
      const condition = conditions[i]!;
      const alias = `order_cell_${i}`;
      const cursorValue = cursorValues[i];
      const isAscending = condition.direction === OrderDirections.Ascending.value;
      
      // Build the "equal up to this point" conditions
      const equalConditions: Prisma.Sql[] = [];
      for (let j = 0; j < i; j++) {
        const prevAlias = `order_cell_${j}`;
        const prevCursorValue = cursorValues[j];
        
        equalConditions.push(Prisma.sql`COALESCE(${Prisma.raw(prevAlias)}."sort_key", '') = ${prevCursorValue}`);
      }
      
      // Build the "greater/less than" condition for current column
      const operator = isAscending ? Prisma.sql`>` : Prisma.sql`<`;
      const comparisonCondition = Prisma.sql`COALESCE(${Prisma.raw(alias)}."sort_key", '') ${operator} ${cursorValue}`;
      
      // Combine: (col1 = cursor1 AND col2 = cursor2 AND ... AND colN > cursorN)
      if (equalConditions.length > 0) {
        const allEqual = Prisma.join(equalConditions, ' AND ');
        orConditions.push(Prisma.sql`(${allEqual} AND ${comparisonCondition})`);
      } else {
        orConditions.push(Prisma.sql`(${comparisonCondition})`);
      }
    }
    
    // Final condition: all columns equal, row_id > cursor_row_id
    const allEqualConditions: Prisma.Sql[] = [];
    for (let i = 0; i < conditions.length; i++) {
      const alias = `order_cell_${i}`;
      const cursorValue = cursorValues[i];
      
      allEqualConditions.push(Prisma.sql`COALESCE(${Prisma.raw(alias)}."sort_key", '') = ${cursorValue}`);
    }
    const allEqual = Prisma.join(allEqualConditions, ' AND ');
    orConditions.push(Prisma.sql`(${allEqual} AND r."id" > ${cursorRowId})`);
    
    return Prisma.sql`(${Prisma.join(orConditions, ' OR ')})`;
  }

  private buildJoinClause(viewOrdering?: ViewOrderingList | null): Prisma.Sql {
    if (!viewOrdering || viewOrdering.conditions.length === 0) {
      return Prisma.empty;
    }

    const joins: Prisma.Sql[] = [];
    
    viewOrdering.conditions.forEach((condition, index) => {
      const alias = `order_cell_${index}`;
      joins.push(Prisma.sql`
        LEFT JOIN "Cell" ${Prisma.raw(alias)} ON ${Prisma.raw(alias)}."row_id" = r."id" 
          AND ${Prisma.raw(alias)}."column_id" = ${condition.column_id}
      `);
    });
    
    return Prisma.join(joins, ' ');
  }

  private buildOrderByClause(viewOrdering?: ViewOrderingList | null): Prisma.Sql {
    if (!viewOrdering || viewOrdering.conditions.length === 0) {
      return Prisma.sql`r."id" ASC`;
    }

    const orderByClauses: Prisma.Sql[] = [];
    
    viewOrdering.conditions.forEach((condition, index) => {
      const alias = `order_cell_${index}`;
      const direction = condition.direction === OrderDirections.Ascending.value ? Prisma.sql`ASC` : Prisma.sql`DESC`;
      orderByClauses.push(Prisma.sql`COALESCE(${Prisma.raw(alias)}."sort_key", '') ${direction}`);
    });
    
    orderByClauses.push(Prisma.sql`r."id" ASC`);
    return Prisma.join(orderByClauses, ', ');
  }

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

  async getViewRowsPaginated(
    id: string, 
    cursor?: CompositeCursor, 
    limit = 50, 
    viewFilters?: ViewFilter | null, 
    searchString?: string, 
    viewOrdering?: ViewOrderingList | null
  ): Promise<PaginatedViewData> {
    const view = await db.view.findUniqueOrThrow({
      where: { id },
      select: { tableId: true },
    });

    const joinClause = this.buildJoinClause(viewOrdering);
    const whereClause = this.buildWhereClause(view.tableId, cursor, viewOrdering, viewFilters, searchString);
    const orderByClause = this.buildOrderByClause(viewOrdering);
    
    let selectClause = Prisma.sql`r."id", r."table_id"`;
    if (viewOrdering && viewOrdering.conditions.length > 0) {
      const sortedColumns = viewOrdering.conditions.map((_, index) => {
        const alias = `order_cell_${index}`;
        return Prisma.sql`COALESCE(${Prisma.raw(alias)}."sort_key", '') as ${Prisma.raw(`sort_value_${index}`)}`;
      });
      selectClause = Prisma.join([selectClause, ...sortedColumns], ', ');
    }

    const query = Prisma.sql`
      SELECT ${selectClause}
      FROM "Row" r
      ${joinClause}
      WHERE ${whereClause}
      ORDER BY ${orderByClause}
      LIMIT ${limit + 1}
    `;
            
    const rows = await db.$queryRaw<Array<{ 
      id: bigint; 
      table_id: string;
      [key: string]: string | bigint | null;
    }>>(query);

    const hasNextPage = rows.length > limit;
    const paginatedRows = hasNextPage ? rows.slice(0, -1) : rows;
    
    let nextCursor: CompositeCursor | undefined;
    if (hasNextPage) {
      const lastRow = paginatedRows[paginatedRows.length - 1]!;
      nextCursor = { cellValues: [], row_id: lastRow.id };
      if (viewOrdering && viewOrdering.conditions.length > 0) {
        for (let i = 0; i < viewOrdering.conditions.length; i++) {
          const key = `sort_value_${i}`;
          const value = lastRow[key];
          nextCursor.cellValues.push(String(value ?? ''));
        }
      }
    } else {
      nextCursor = undefined;
    }

    const rowIds = paginatedRows.map((row: { id: bigint; table_id: string; [key: string]: string | bigint | null }) => row.id);

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

    const transformedRows = paginatedRows.map((row: { id: bigint; table_id: string; [key: string]: string | bigint | null }) => {
      const rowData: { id: string;[columnId: string]: string | null } = {
        id: row.id.toString(),
      };

      const rowCells = cells.filter((cell: { rowId: bigint; columnId: string; value: string | null }) => cell.rowId === row.id);

      rowCells.forEach((cell: { rowId: bigint; columnId: string; value: string | null }) => {
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
      columns: view.table.columns.map((col: { id: string; name: string; columnType: string; orderIndex: number }) => ({
        id: col.id,
        name: col.name,
        columnType: col.columnType as unknown as ColumnTypeValue,
        orderIndex: col.orderIndex,
      })),
      totalRows: view.table._count.rows,
    };
  }

  async addHiddenColumn(viewId: string, columnId: string): Promise<void> {
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
      const confData = existingConf.confJson as { columnIds: string[] };
      hiddenColumns = confData.columnIds || [];
    }

    if (!hiddenColumns.includes(columnId)) {
      hiddenColumns.push(columnId);

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
    const existingConf = await db.viewConf.findUniqueOrThrow({
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
    await db.view.findUniqueOrThrow({
      where: { id: viewId },
      select: { id: true },
    });

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
      const confData = existingConf.confJson as unknown as ViewFilter;
      filters = confData || { operator: LogicalOperators.AND.value, conditions: [] };

      if (filters.operator !== operator) {
        throw new Error(`Filter operator mismatch. Expected ${filters.operator} but got ${operator}`);
      }
    } else {
      filters = {
        operator,
        conditions: []
      };
    }

    filters.conditions.push(condition);

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
    const existingConf = await db.viewConf.findUniqueOrThrow({
      where: {
        viewId_key: {
          viewId,
          key: "filters",
        },
      },
    });

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

  async updateViewFilterCondition(viewId: string, conditionIndex: number, condition: ViewFilterCondition): Promise<void> {
    const existingConf = await db.viewConf.findUniqueOrThrow({
      where: {
        viewId_key: {
          viewId,
          key: "filters",
        },
      },
    });

    const filters = existingConf.confJson as unknown as ViewFilter;

    if (!filters?.conditions) {
      throw new Error(`No filters found for view ${viewId}`);
    }

    if (conditionIndex < 0 || conditionIndex >= filters.conditions.length) {
      throw new Error(`Invalid condition index: ${conditionIndex}`);
    }

    filters.conditions[conditionIndex] = condition;

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
    const existingConf = await db.viewConf.findUniqueOrThrow({
      where: {
        viewId_key: {
          viewId,
          key: "filters",
        },
      },
    });

    const filters = existingConf.confJson as unknown as ViewFilter;

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

  async getViewOrdering(viewId: string): Promise<ViewOrderingList | null> {
    const existingConf = await db.viewConf.findUnique({
      where: {
        viewId_key: {
          viewId,
          key: "order",
        },
      },
    });

    if (existingConf) {
      return existingConf.confJson as unknown as ViewOrderingList;
    }

    return null;
  }

  async addViewOrderingCondition(viewId: string, condition: ViewOrderingCondition): Promise<void> {
    await db.view.findUniqueOrThrow({
      where: { id: viewId },
      select: { id: true },
    });

    const existingConf = await db.viewConf.findUnique({
      where: {
        viewId_key: {
          viewId,
          key: "order",
        },
      },
    });

    let ordering: ViewOrderingList;
    if (existingConf) {
      const confData = existingConf.confJson as unknown as ViewOrderingList;
      ordering = confData || { conditions: [] };
    } else {
      ordering = {
        conditions: []
      };
    }

    ordering.conditions.push(condition);

    await db.viewConf.upsert({
      where: {
        viewId_key: {
          viewId,
          key: "order",
        },
      },
      create: {
        viewId,
        key: "order",
        confJson: ordering as unknown as Prisma.InputJsonValue,
      },
      update: {
        confJson: ordering as unknown as Prisma.InputJsonValue,
      },
    });
  }

  async removeViewOrderingCondition(viewId: string, conditionIndex: number): Promise<void> {
    const existingConf = await db.viewConf.findUniqueOrThrow({
      where: {
        viewId_key: {
          viewId,
          key: "order",
        },
      },
    });

    const ordering = existingConf.confJson as unknown as ViewOrderingList;

    if (!ordering?.conditions) {
      return;
    }

    if (conditionIndex < 0 || conditionIndex >= ordering.conditions.length) {
      throw new Error(`Invalid condition index: ${conditionIndex}`);
    }

    ordering.conditions.splice(conditionIndex, 1);

    if (ordering.conditions.length === 0) {
      await db.viewConf.delete({
        where: {
          viewId_key: {
            viewId,
            key: "order",
          },
        },
      });
    } else {
      await db.viewConf.update({
        where: {
          viewId_key: {
            viewId,
            key: "order",
          },
        },
        data: {
          confJson: ordering as unknown as Prisma.InputJsonValue,
        },
      });
    }
  }

  async updateViewOrderingCondition(viewId: string, conditionIndex: number, condition: ViewOrderingCondition): Promise<void> {
    const existingConf = await db.viewConf.findUniqueOrThrow({
      where: {
        viewId_key: {
          viewId,
          key: "order",
        },
      },
    });

    const ordering = existingConf.confJson as unknown as ViewOrderingList;

    if (!ordering?.conditions) {
      throw new Error(`No ordering found for view ${viewId}`);
    }

    if (conditionIndex < 0 || conditionIndex >= ordering.conditions.length) {
      throw new Error(`Invalid condition index: ${conditionIndex}`);
    }

    ordering.conditions[conditionIndex] = condition;

    await db.viewConf.update({
      where: {
        viewId_key: {
          viewId,
          key: "order",
        },
      },
      data: {
        confJson: ordering as unknown as Prisma.InputJsonValue,
      },
    });
  }
}

export const viewRepository = new PrismaViewRepository();