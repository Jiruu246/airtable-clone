import { z } from "zod";
import { baseOwnerProcedure, createTRPCRouter, tableOwnerProcedure } from "~/server/api/trpc";
import { tableService } from "~/server/services/table.service";
import { ColumnTypeZodEnum } from "../schema/schema";

const createTableSchema = z.object({
  name: z.string().min(1, "Table name is required").max(100, "Table name must be 100 characters or less"),
  baseId: z.string().uuid("Invalid base ID"),
});

const updateTableSchema = z.object({
  tableId: z.string().uuid("Invalid table ID"),
  name: z.string().min(1, "Table name is required").max(100, "Table name must be 100 characters or less"),
});

const deleteTableSchema = z.object({
  tableId: z.string().uuid("Invalid table ID"),
});

const getTableSchema = z.object({
  tableId: z.string().uuid("Invalid table ID"),
});

const getTablesByBaseSchema = z.object({
  baseId: z.string().uuid("Invalid base ID"),
});

const createTableWithSampleDataSchema = z.object({
  name: z.string().max(100, "Table name must be 100 characters or less").default("Sample Table"),
  baseId: z.string().uuid("Invalid base ID"),
});

const createRandomRowsSchema = z.object({
  tableId: z.string().uuid("Invalid table ID"),
  numberOfRows: z.number().int().min(1).max(100000).default(1),
});

const addColumnSchema = z.object({
  tableId: z.string().uuid("Invalid table ID"),
  columnName: z.string().max(100, "Column name must be 100 characters or less").optional(),
  columnType: ColumnTypeZodEnum,
});

export const tableRouter = createTRPCRouter({
  getByBaseId: baseOwnerProcedure
    .input(getTablesByBaseSchema)
    .query(async ({ input }) => {
      return await tableService.listTablesByBaseId(input.baseId);
    }),

  getById: tableOwnerProcedure
    .input(getTableSchema)
    .query(async ({ input }) => {
      return await tableService.getById(input.tableId);
    }),

  create: baseOwnerProcedure
    .input(createTableSchema)
    .mutation(async ({ input }) => {
      return await tableService.createTable({
        name: input.name,
        baseId: input.baseId,
      });
    }),

  update: tableOwnerProcedure
    .input(updateTableSchema)
    .mutation(async ({ input }) => {
      return await tableService.updateTable({
        id: input.tableId,
        name: input.name,
      });
    }),

  delete: tableOwnerProcedure
    .input(deleteTableSchema)
    .mutation(async ({ input }) => {
      await tableService.deleteTable({
        id: input.tableId,
      });
      
      return { success: true };
    }),

  createWithSampleData: baseOwnerProcedure
    .input(createTableWithSampleDataSchema)
    .mutation(async ({ input }) => {
      return await tableService.createTableWithSampleData({
        name: input.name,
        baseId: input.baseId,
      });
    }),

  createRandomRows: tableOwnerProcedure
    .input(createRandomRowsSchema)
    .mutation(async ({ input }) => {
      await tableService.createRandomRows({
        tableId: input.tableId,
        numberOfRows: input.numberOfRows,
      });
      
      return { success: true, rowsCreated: input.numberOfRows };
    }),

  addColumn: tableOwnerProcedure
    .input(addColumnSchema)
    .mutation(async ({ input }) => {
      return await tableService.addColumn({
        tableId: input.tableId,
        columnName: input.columnName,
        columnType: input.columnType,
      });
    }),
});