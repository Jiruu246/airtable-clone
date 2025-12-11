import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { tableService } from "~/server/services/table.service";
import { ColumnTypeZodEnum } from "../schema/schema";

const createTableSchema = z.object({
  name: z.string().min(1, "Table name is required").max(100, "Table name must be 100 characters or less"),
  baseId: z.string().uuid("Invalid base ID"),
});

const updateTableSchema = z.object({
  id: z.string().uuid("Invalid table ID"),
  name: z.string().min(1, "Table name is required").max(100, "Table name must be 100 characters or less"),
});

const deleteTableSchema = z.object({
  id: z.string().uuid("Invalid table ID"),
});

const getTableSchema = z.object({
  id: z.string().uuid("Invalid table ID"),
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
  getByBaseId: protectedProcedure
    .input(getTablesByBaseSchema)
    .query(async ({ input }) => {
      return await tableService.listTablesByBaseId(input.baseId);
    }),

  getById: protectedProcedure
    .input(getTableSchema)
    .query(async ({ input }) => {
      return await tableService.getById(input.id);
    }),

  create: protectedProcedure
    .input(createTableSchema)
    .mutation(async ({ input }) => {
      return await tableService.createTable({
        name: input.name,
        baseId: input.baseId,
      });
    }),

  update: protectedProcedure
    .input(updateTableSchema)
    .mutation(async ({ input }) => {
      return await tableService.updateTable({
        id: input.id,
        name: input.name,
      });
    }),

  delete: protectedProcedure
    .input(deleteTableSchema)
    .mutation(async ({ input }) => {
      await tableService.deleteTable({
        id: input.id,
      });
      
      return { success: true };
    }),

  createWithSampleData: protectedProcedure
    .input(createTableWithSampleDataSchema)
    .mutation(async ({ input }) => {
      return await tableService.createTableWithSampleData({
        name: input.name,
        baseId: input.baseId,
      });
    }),

  createRandomRows: protectedProcedure
    .input(createRandomRowsSchema)
    .mutation(async ({ input }) => {
      await tableService.createRandomRows({
        tableId: input.tableId,
        numberOfRows: input.numberOfRows,
      });
      
      return { success: true, rowsCreated: input.numberOfRows };
    }),

  addColumn: protectedProcedure
    .input(addColumnSchema)
    .mutation(async ({ input }) => {
      return await tableService.addColumn({
        tableId: input.tableId,
        columnName: input.columnName,
        columnType: input.columnType,
      });
    }),
});