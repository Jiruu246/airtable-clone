import { TRPCError } from "@trpc/server";
import {
  type TableRepository,
  type Table,
  type CreateTableData,
  type UpdateTableData,
  type CreateTableWithDataInput,
  type TableData,
  tableRepository,
} from "~/server/repositories/table.repository";

export interface TableService {
  listTablesByBaseId(baseId: string): Promise<Table[]>;
  getById(id: string): Promise<Table>;
  getTableData(id: string): Promise<TableData>;
  createTable(data: CreateTableInput): Promise<Table>;
  updateTable(data: UpdateTableInput): Promise<Table>;
  deleteTable(data: DeleteTableInput): Promise<void>;
  createTableWithSampleData(data: CreateTableWithSampleDataInput): Promise<Table>;
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
    orderIndex: number;
  }[];
  rows: Record<string, string>[];
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
}

export const tableService = new TableServiceImpl(tableRepository);