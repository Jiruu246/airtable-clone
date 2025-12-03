import { TRPCError } from "@trpc/server";
import {
  type TableRepository,
  type Table,
  type CreateTableData,
  type UpdateTableData,
  type CreateTableWithDataInput,
  type TableData,
  type TableMetadata,
  type PaginatedTableData,
  tableRepository,
} from "~/server/repositories/table.repository";
import { RandomDataGenerator } from "~/server/utils/sample-data";

export interface TableService {
  listTablesByBaseId(baseId: string): Promise<Table[]>;
  getById(id: string): Promise<Table>;
  getTableData(id: string): Promise<TableData>;
  getTableRowsPaginated(id: string, cursor?: string, limit?: number): Promise<PaginatedTableData>;
  getTableMetadata(id: string): Promise<TableMetadata>;
  createTable(data: CreateTableInput): Promise<Table>;
  updateTable(data: UpdateTableInput): Promise<Table>;
  deleteTable(data: DeleteTableInput): Promise<void>;
  createTableWithSampleData(data: CreateTableWithSampleDataInput): Promise<Table>;
  createRandomRows(data: CreateRandomRowsInput): Promise<void>;
}

export interface CreateTableInput {
  name: string;
  baseId: string;
}

export interface UpdateTableInput {
  id: string;
  name: string;
}

export interface DeleteTableInput {
  id: string;
}

export interface CreateTableWithSampleDataInput {
  name: string;
  baseId: string;
  columns: {
    name: string;
    type: string;
  }[];
  rows: Record<string, string>[];
}

export interface CreateRandomRowsInput {
  tableId: string;
  numberOfRows: number;
}

export class TableServiceImpl implements TableService {
  constructor(private readonly repository: TableRepository) {}

  async listTablesByBaseId(baseId: string): Promise<Table[]> {
    return await this.repository.findByBaseId(baseId);
  }

  async getById(id: string): Promise<Table> {
    const table = await this.repository.findById(id);
    
    if (!table) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Table not found",
      });
    }
    
    return table;
  }

  async getTableData(id: string): Promise<TableData> {
    const tableData = await this.repository.getTableData(id);
    
    if (!tableData) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Table not found",
      });
    }
    
    return tableData;
  }

  async getTableRowsPaginated(id: string, cursor?: string, limit?: number): Promise<PaginatedTableData> {
    try {
      return await this.repository.getTableRowsPaginated(id, cursor, limit);
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get paginated table rows",
        cause: error,
      });
    }
  }

  async getTableMetadata(id: string): Promise<TableMetadata> {
    const tableMetadata = await this.repository.getTableMetadata(id);
    
    if (!tableMetadata) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Table not found",
      });
    }
    
    return tableMetadata;
  }

  async createTable(data: CreateTableInput): Promise<Table> {
    const createData: CreateTableData = {
      name: data.name.trim(),
      baseId: data.baseId,
    };

    try {
      return await this.repository.create(createData);
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create table",
        cause: error,
      });
    }
  }

  async updateTable(data: UpdateTableInput): Promise<Table> {
    const existingTable = await this.repository.findById(data.id);

    if (!existingTable) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Table not found",
      });
    }

    const updateData: UpdateTableData = {
      name: data.name.trim(),
    };

    try {
      return await this.repository.update(data.id, updateData);
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to update table",
        cause: error,
      });
    }
  }

  async deleteTable(data: DeleteTableInput): Promise<void> {
    const existingTable = await this.repository.findById(data.id);

    if (!existingTable) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Table not found",
      });
    }

    try {
      await this.repository.delete(data.id);
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to delete table",
        cause: error,
      });
    }
  }

  async createTableWithSampleData(data: CreateTableWithSampleDataInput): Promise<Table> {
    const createData: CreateTableWithDataInput = {
      name: data.name.trim(),
      baseId: data.baseId,
      columns: data.columns,
      rows: data.rows,
    };

    try {
      return await this.repository.createWithColumnsAndRows(createData);
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create table with sample data",
        cause: error,
      });
    }
  }

  async createRandomRows(data: CreateRandomRowsInput): Promise<void> {
    const tableMetadata = await this.repository.getTableMetadata(data.tableId);
    
    if (!tableMetadata) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Table not found",
      });
    }

    if (tableMetadata.columns.length === 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Table has no columns",
      });
    }

    try {
      const randomRows = RandomDataGenerator.generateRowsForColumns(
        tableMetadata.columns.map(col => ({
          name: col.name,
          type: col.type,
        })),
        data.numberOfRows
      );

      // Create the rows with the generated data
      await this.repository.createRowsWithData(data.tableId, randomRows, tableMetadata.columns);
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create random rows",
        cause: error,
      });
    }
  }
}

export const tableService = new TableServiceImpl(tableRepository);