import { faker } from "@faker-js/faker";

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
  type: string;
}

export class RandomDataGenerator {
  /**
   * Generate random value based on column type
   */
  static generateValueForColumn(column: Column): string {
    switch (column.type.toLowerCase()) {
      case 'number':
        return faker.number.int({ min: 1, max: 1000 }).toString();
      case 'text':
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
        row[column.name] = this.generateValueForColumn(column);
      }
      return row;
    });
  }

  /**
   * Generate a sample table with predefined columns
   */
  // static generateSampleTable(): SampleTableData {
  //   const columns = [
  //     { name: "Name", type: "text", orderIndex: 0 },
  //     { name: "Score", type: "number", orderIndex: 1 },
  //   ];
    
  //   const numberOfRows = 100;
  //   const rows = this.generateRowsForColumns(columns, numberOfRows);
    
  //   return {
  //     name: "Sample Table",
  //     columns,
  //     rows,
  //   };
  // }
}

// Keep backward compatibility
export const SampleDataGenerator = RandomDataGenerator;