import { db } from "~/server/db";
import type { ColumnTypeValue } from "~/data/columnTypes";

export interface TableRepository {
  findByBaseId(baseId: string): Promise<Table[]>;
  findById(id: string): Promise<Table | null>;
  create(data: CreateTableData): Promise<Table>;
  update(id: string, data: UpdateTableData): Promise<Table>;
  delete(id: string): Promise<void>;
  createWithColumnsAndRows(data: CreateTableWithDataInput): Promise<Table>;
  getTableMetadata(id: string): Promise<TableMetadata | null>;
  createRowsWithData(tableId: string, processedRows: Record<string, { value: string; sortKey: string; }>[], columns: { id: string; name: string; }[]): Promise<void>;
  addColumn(data: AddColumnData): Promise<ColumnMetadata>;
  getColumnMetadata(columnId: string): Promise<ColumnMetadata | null>;
}

export interface Table {
  id: string;
  name: string;
  baseId: string;
  views?: {
    id: string;
    name: string;
  }[];
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
    columnType: string;
  }[];
  processedRows: Record<string, { value: string; sortKey: string; }>[];
}

export interface AddColumnData {
  tableId: string;
  name: string;
  columnType: ColumnTypeValue;
  orderIndex: number;
}

export interface TableData {
  id: string;
  name: string;
  baseId: string;
  columns: {
    id: string;
    name: string;
    columnType: ColumnTypeValue;
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
    columnType: ColumnTypeValue;
    orderIndex: number;
  }[];
  totalRows: number;
}

export interface ColumnMetadata {
  id: string;
  name: string;
  columnType: ColumnTypeValue;
  orderIndex: number;
  tableId: string;
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
        views: {
          select: {
            id: true,
            name: true,
          },
        },
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
        views: {
          select: {
            id: true,
            name: true,
          },
        },
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
              columnType: col.columnType,
              orderIndex: index,
              tableId: table.id,
            },
          })
        )
      );

      if (data.processedRows.length > 0) {
        const rowsToCreate = data.processedRows.map(() => ({
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

        if (createdRows.length !== data.processedRows.length) {
          throw new Error(`Expected ${data.processedRows.length} rows to be created, but got ${createdRows.length}`);
        }

        const cellsToCreate = [];
        for (let rowIndex = 0; rowIndex < data.processedRows.length; rowIndex++) {
          const processedRowData = data.processedRows[rowIndex];
          const createdRow = createdRows[rowIndex];
          
          if (!processedRowData) {
            throw new Error(`Processed row data at index ${rowIndex} is undefined`);
          }
          
          if (!createdRow) {
            throw new Error(`Row at index ${rowIndex} was not created properly`);
          }
          
          const rowId = createdRow.id;
          
          for (const column of columns) {
            const cellData = processedRowData[column.name];
            const value = cellData?.value ?? '';
            const sortKey = cellData?.sortKey ?? '';
            cellsToCreate.push({
              rowId,
              columnId: column.id,
              value,
              sort_key: sortKey,
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
    });

    if (!table) {
      return null;
    }

    return {
      id: table.id,
      name: table.name,
      baseId: table.baseId,
      columns: table.columns.map((col) => ({
        id: col.id,
        name: col.name,
        columnType: col.columnType as ColumnTypeValue,
        orderIndex: col.orderIndex,
      })),
      totalRows: table._count.rows,
    };
  }

  async createRowsWithData(tableId: string, processedRows: Record<string, { value: string; sortKey: string; }>[], columns: { id: string; name: string; }[]): Promise<void> {
    if (processedRows.length === 0) {
      return;
    }

    const BATCH_SIZE = 20_000;

    for (let i = 0; i < processedRows.length; i += BATCH_SIZE) {
      const batch = processedRows.slice(i, i + BATCH_SIZE);

      await db.$transaction(async (tx) => {
        const rowsToCreate = Array.from({ length: batch.length }, () => ({
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
          take: batch.length,
        });

        if (createdRows.length !== batch.length) {
          throw new Error(`Expected ${batch.length} rows to be created, but got ${createdRows.length}`);
        }

        // Create cells with the provided data
        const cellsToCreate = [];
        for (let rowIndex = 0; rowIndex < batch.length; rowIndex++) {
          const processedRowData = batch[rowIndex];
          const createdRow = createdRows[rowIndex];
          
          if (!processedRowData || !createdRow) {
            throw new Error(`Processed row data or created row at index ${rowIndex} is undefined`);
          }
          
          for (const column of columns) {
            const cellData = processedRowData[column.name];
            const value = cellData?.value ?? '';
            const sortKey = cellData?.sortKey ?? '';
            cellsToCreate.push({
              rowId: createdRow.id,
              columnId: column.id,
              value,
              sort_key: sortKey,
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
  }

  async addColumn(data: AddColumnData): Promise<ColumnMetadata> {
    const column = await db.column.create({
      data: {
        name: data.name,
        columnType: data.columnType,
        orderIndex: data.orderIndex,
        tableId: data.tableId,
      },
      select: {
        id: true,
        name: true,
        columnType: true,
        orderIndex: true,
      },
    });

    return {
      id: column.id,
      name: column.name,
      columnType: column.columnType as ColumnTypeValue,
      orderIndex: column.orderIndex,
      tableId: data.tableId,
    };
  }

  async getColumnMetadata(columnId: string): Promise<ColumnMetadata | null> {
    const column = await db.column.findUnique({
      where: { id: columnId },
      select: {
        id: true,
        name: true,
        columnType: true,
        orderIndex: true,
        tableId: true,
      },
    });

    if (!column) {
      return null;
    }

    return {
      id: column.id,
      name: column.name,
      columnType: column.columnType as ColumnTypeValue,
      orderIndex: column.orderIndex,
      tableId: column.tableId,
    };
  }
}

export const tableRepository = new PrismaTableRepository();