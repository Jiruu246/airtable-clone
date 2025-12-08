import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { cellService } from "~/server/services/cell.service";

const deleteCellSchema = z.object({
  rowId: z.string().min(1, "Row ID is required"),
  columnId: z.string().uuid("Invalid column ID"),
});

const upsertCellSchema = z.object({
  rowId: z.string().min(1, "Row ID is required"),
  columnId: z.string().uuid("Invalid column ID"),
  tableId: z.string().uuid("Invalid table ID"),
  value: z.string().nullable(),
});

export const cellRouter = createTRPCRouter({
  delete: protectedProcedure
    .input(deleteCellSchema)
    .mutation(async ({ input }) => {
      await cellService.deleteCell({
        rowId: input.rowId,
        columnId: input.columnId,
      });
      
      return { success: true };
    }),

  upsert: protectedProcedure
    .input(upsertCellSchema)
    .mutation(async ({ input }) => {
      return await cellService.upsertCell({
        rowId: input.rowId,
        columnId: input.columnId,
        tableId: input.tableId,
        value: input.value,
      });
    }),
});