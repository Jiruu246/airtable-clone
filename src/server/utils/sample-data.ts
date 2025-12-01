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

export class SampleDataGenerator {
  static generateSampleTable(): SampleTableData {
    const columns = [
      { name: "Name", type: "text", orderIndex: 0 },
      { name: "Score", type: "number", orderIndex: 1 },
    ];
    
    const numberOfRows = 100_000;
    const rows = Array.from({ length: numberOfRows }, () => ({
      "Name": faker.lorem.words(2),
      "Score": faker.number.int({ min: 1, max: 100 }).toString(),
    }));
    
    return {
      name: "Sample Table",
      columns,
      rows,
    };
  }
}