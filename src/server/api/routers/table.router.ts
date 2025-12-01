import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { tableService } from "~/server/services/table.service";

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

const getTableDataSchema = z.object({
  id: z.string().uuid("Invalid table ID"),
});

const getTablesByBaseSchema = z.object({
  baseId: z.string().uuid("Invalid base ID"),
});

const createTableWithSampleDataSchema = z.object({
  name: z.string().min(1, "Table name is required").max(100, "Table name must be 100 characters or less"),
  baseId: z.string().uuid("Invalid base ID"),
  columns: z.array(z.object({
    name: z.string(),
    type: z.string(),
    orderIndex: z.number(),
  })),
  rows: z.array(z.record(z.string())),
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

  getTableData: protectedProcedure
    .input(getTableDataSchema)
    .query(async ({ input }) => {
      return await tableService.getTableData(input.id);
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
        columns: input.columns,
        rows: input.rows,
      });
    }),
});