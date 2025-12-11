import { faker } from "@faker-js/faker";
import { ColumnTypes, type ColumnTypeValue } from "~/data/columnTypes";

export interface SampleTableData {
  name: string;
  columns: {
    name: string;
    type: string;
    orderIndex: number;
  }[];
  rows: Record<string, string>[];
}

export interface Column {
  name: string;
  columnType: ColumnTypeValue;
}

export class RandomDataGenerator {
  /**
   * Generate random value based on column type
   */
  static generateValueForColumn(columnType: ColumnTypeValue): string {
    switch (columnType) {
      case ColumnTypes.Number.value:
        return faker.number.int({ min: 1, max: 1000 }).toString();
      case ColumnTypes.Text.value:
      default:
        return faker.lorem.words({ min: 1, max: 3 });
    }
  }

  /**
   * Generate multiple random rows for given columns
   */
  static generateRowsForColumns(columns: Column[], numberOfRows: number): Record<string, string>[] {
    return Array.from({ length: numberOfRows }, () => {
      const row: Record<string, string> = {};
      for (const column of columns) {
        row[column.name] = this.generateValueForColumn(column.columnType);
      }
      return row;
    });
  }
}