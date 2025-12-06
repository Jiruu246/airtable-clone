import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { viewService } from "~/server/services/view.service";

const getViewRowsPaginatedSchema = z.object({
  id: z.string().uuid("Invalid view ID"),
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(1000).default(50),
});

const getViewMetadataSchema = z.object({
  id: z.string().uuid("Invalid view ID"),
});

const listViewsByTableSchema = z.object({
  tableId: z.string().uuid("Invalid table ID"),
});

const addHiddenColumnSchema = z.object({
  viewId: z.string().uuid("Invalid view ID"),
  columnId: z.string().uuid("Invalid column ID"),
});

const removeHiddenColumnSchema = z.object({
  viewId: z.string().uuid("Invalid view ID"),
  columnId: z.string().uuid("Invalid column ID"),
});

const getHiddenColumnsSchema = z.object({
  viewId: z.string().uuid("Invalid view ID"),
});

export const viewRouter = createTRPCRouter({
  listViewsByTableId: protectedProcedure
    .input(listViewsByTableSchema)
    .query(async ({ input }) => {
      return await viewService.listViewsByTableId(input.tableId);
    }),

  getViewRowsPaginated: protectedProcedure
    .input(getViewRowsPaginatedSchema)
    .query(async ({ input }) => {
      return await viewService.getViewRowsPaginated(input.id, input.cursor, input.limit);
    }),

  getViewMetadata: protectedProcedure
    .input(getViewMetadataSchema)
    .query(async ({ input }) => {
      return await viewService.getViewMetadata(input.id);
    }),

  addHiddenColumn: protectedProcedure
    .input(addHiddenColumnSchema)
    .mutation(async ({ input }) => {
      await viewService.addHiddenColumn(input.viewId, input.columnId);
      return { success: true };
    }),

  removeHiddenColumn: protectedProcedure
    .input(removeHiddenColumnSchema)
    .mutation(async ({ input }) => {
      await viewService.removeHiddenColumn(input.viewId, input.columnId);
      return { success: true };
    }),

  getHiddenColumns: protectedProcedure
    .input(getHiddenColumnsSchema)
    .query(async ({ input }) => {
      return await viewService.getHiddenColumns(input.viewId);
    }),
});