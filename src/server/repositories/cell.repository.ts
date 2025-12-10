import { db } from "~/server/db";

export interface CellRepository {
  findByRowAndColumn(rowId: string, columnId: string): Promise<Cell | null>;
  delete(rowId: string, columnId: string): Promise<void>;
  upsert(rowId: string, columnId: string, data: UpsertCellData): Promise<Cell>;
}

export interface Cell {
  rowId: string;
  columnId: string;
  tableId: string;
  value: string;
}

export interface UpsertCellData {
  tableId: string;
  value: string;
  sort_key: string;
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
        sort_key: data.sort_key
      },
      create: {
        rowId: BigInt(rowId),
        columnId,
        tableId: data.tableId,
        value: data.value,
        sort_key: data.sort_key
      },
    });

    return {
      rowId: cell.rowId.toString(),
      columnId: cell.columnId,
      tableId: cell.tableId,
      value: cell.value,
    };
  }
}

export const cellRepository = new PrismaCellRepository();