import { TRPCError } from "@trpc/server";
import { ColumnTypes, type ColumnTypeValue } from "~/data/columnTypes";
import {
  type TableRepository,
  type Table,
  type CreateTableData,
  type UpdateTableData,
  type CreateTableWithDataInput,
  tableRepository,
  type ColumnMetadata,
} from "~/server/repositories/table.repository";
import {
  type ViewRepository,
  viewRepository,
} from "~/server/repositories/view.repository";
import { RandomDataGenerator } from "~/server/utils/sample-data";
import { CellServiceImpl } from "~/server/services/cell.service";

export interface TableService {
  listTablesByBaseId(baseId: string): Promise<Table[]>;
  getById(id: string): Promise<Table>;
  createTable(data: CreateTableInput): Promise<Table>;
  updateTable(data: UpdateTableInput): Promise<Table>;
  deleteTable(data: DeleteTableInput): Promise<void>;
  createTableWithSampleData(data: CreateTableInput): Promise<Table>;
  createRandomRows(data: CreateRandomRowsInput): Promise<void>;
  addColumn(data: AddColumnInput): Promise<{ id: string; name: string; columnType: string; orderIndex: number; }>;
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



export interface CreateRandomRowsInput {
  tableId: string;
  numberOfRows: number;
}

export interface AddColumnInput {
  tableId: string;
  columnName?: string;
  columnType: ColumnTypeValue;
}

export class TableServiceImpl implements TableService {
  constructor(
    private readonly repository: TableRepository,
    private readonly viewRepository: ViewRepository
  ) {}

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

  async createTable(data: CreateTableInput): Promise<Table> {
    const createData: CreateTableData = {
      name: data.name.trim(),
      baseId: data.baseId,
    };

    //TODO: turn this into a transaction
    try {
      const table = await this.repository.create(createData);
      
      // Create default GridView for the table
      await this.viewRepository.create({
        name: 'Grid view',
        tableId: table.id,
      });
      
      return table;
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

  async createTableWithSampleData(data: CreateTableInput): Promise<Table> {
    const columns = [
      { name: "Name", columnType: ColumnTypes.Text.value },
      { name: "Score", columnType: ColumnTypes.Number.value },
    ];
    
    const numberOfRows = 100;
    const rows = RandomDataGenerator.generateRowsForColumns(columns, numberOfRows);
    
    const processedRows = rows.map(row => {
      const processedRow: Record<string, { value: string; sortKey: string; }> = {};
      
      columns.forEach(column => {
        const value = row[column.name] ?? '';
        processedRow[column.name] = {
          value,
          sortKey: CellServiceImpl.EncodeSortKey(value, column.columnType)
        };
      });
      
      return processedRow;
    });

    const createData: CreateTableWithDataInput = {
      name: data.name.trim(),
      baseId: data.baseId,
      columns,
      processedRows,
    };

    try {
      const table = await this.repository.createWithColumnsAndRows(createData);
      
      await this.viewRepository.create({
        name: 'Grid view',
        tableId: table.id,
      });
      
      return table;
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
          columnType: col.columnType,
        })),
        data.numberOfRows
      );

      // Process rows with sort keys
      const processedRows = randomRows.map(row => {
        const processedRow: Record<string, { value: string; sortKey: string; }> = {};
        
        tableMetadata.columns.forEach(column => {
          const value = row[column.name] ?? '';
          processedRow[column.name] = {
            value,
            sortKey: CellServiceImpl.EncodeSortKey(value, column.columnType)
          };
        });
        
        return processedRow;
      });

      await this.repository.createRowsWithData(data.tableId, processedRows, tableMetadata.columns);
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create random rows",
        cause: error,
      });
    }
  }

  async addColumn(data: AddColumnInput): Promise<ColumnMetadata> {
    const table = await this.repository.findById(data.tableId);
    if (!table) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Table not found",
      });
    }

    const tableMetadata = await this.repository.getTableMetadata(data.tableId);
    if (!tableMetadata) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Table metadata not found",
      });
    }

    const columnName = (data.columnName?.trim() ?? '' ) || 'New Column';

    const nextOrderIndex = tableMetadata.columns.length > 0 
      ? Math.max(...tableMetadata.columns.map(col => col.orderIndex)) + 1 
      : 0;

    try {
      return await this.repository.addColumn({
        tableId: data.tableId,
        name: columnName.trim(),
        columnType: data.columnType,
        orderIndex: nextOrderIndex,
      });
    } catch {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to add column",
      });
    }
  }
}

export const tableService = new TableServiceImpl(tableRepository, viewRepository);