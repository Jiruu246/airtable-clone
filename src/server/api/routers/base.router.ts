import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { baseService } from "~/server/services/base.service";
import { tableService } from "~/server/services/table.service";

const createBaseSchema = z.object({
  name: z.string().min(1, "Base name is required").max(100, "Base name must be 100 characters or less"),
});

const updateBaseSchema = z.object({
  id: z.string().uuid("Invalid base ID"),
  name: z.string().min(1, "Base name is required").max(100, "Base name must be 100 characters or less"),
});

const deleteBaseSchema = z.object({
  id: z.string().uuid("Invalid base ID"),
});

const getBaseSchema = z.object({
  id: z.string().uuid("Invalid base ID"),
});

export const baseRouter = createTRPCRouter({
  list: protectedProcedure
    .query(async ({ ctx }) => {
      return await baseService.listUserBases(ctx.session.user.id);
    }),

  getById: protectedProcedure
    .input(getBaseSchema)
    .query(async ({ ctx, input }) => {
      return await baseService.getById(input.id, ctx.session.user.id);
    }),

  create: protectedProcedure
    .input(createBaseSchema)
    .mutation(async ({ ctx, input }) => {
      return await baseService.createBase({
        name: input.name,
        userId: ctx.session.user.id,
      });
    }),

  update: protectedProcedure
    .input(updateBaseSchema)
    .mutation(async ({ ctx, input }) => {
      return await baseService.updateBase({
        id: input.id,
        name: input.name,
        userId: ctx.session.user.id,
      });
    }),

  delete: protectedProcedure
    .input(deleteBaseSchema)
    .mutation(async ({ ctx, input }) => {
      await baseService.deleteBase({
        id: input.id,
        userId: ctx.session.user.id,
      });
      
      return { success: true };
    }),

  getFirstTableData: protectedProcedure
    .input(getBaseSchema)
    .query(async ({ input }) => {
      // Get tables for the base
      const tables = await tableService.listTablesByBaseId(input.id);
      
      if (tables.length === 0) {
        return null;
      }
      
      // Get data for the first table
      return await tableService.getTableData(tables[0]!.id);
    }),
});