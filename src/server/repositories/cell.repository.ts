import { db } from "~/server/db";

export interface CellRepository {
  findByRowAndColumn(rowId: string, columnId: string): Promise<Cell | null>;
  update(rowId: string, columnId: string, data: UpdateCellData): Promise<Cell>;
  delete(rowId: string, columnId: string): Promise<void>;
  upsert(rowId: string, columnId: string, data: UpsertCellData): Promise<Cell>;
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
}

// Export a singleton instance
export const cellRepository = new PrismaCellRepository();