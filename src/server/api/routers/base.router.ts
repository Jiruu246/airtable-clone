import { z } from "zod";
import { baseOwnerProcedure, createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { baseService } from "~/server/services/base.service";

const createBaseSchema = z.object({
  name: z.string().min(1, "Base name is required").max(100, "Base name must be 100 characters or less"),
});

const updateBaseSchema = z.object({
  baseId: z.string().uuid("Invalid base ID"),
  name: z.string().min(1, "Base name is required").max(100, "Base name must be 100 characters or less"),
});

const deleteBaseSchema = z.object({
  baseId: z.string().uuid("Invalid base ID"),
});

const getBaseSchema = z.object({
  baseId: z.string().uuid("Invalid base ID"),
});

export const baseRouter = createTRPCRouter({
  list: protectedProcedure
    .query(async ({ ctx }) => {
      return await baseService.listUserBases(ctx.session.user.id);
    }),

  getById: baseOwnerProcedure
    .input(getBaseSchema)
    .query(async ({ ctx, input }) => {
      return await baseService.getById(input.baseId, ctx.session.user.id);
    }),

  create: protectedProcedure
    .input(createBaseSchema)
    .mutation(async ({ ctx, input }) => {
      return await baseService.createBase({
        name: input.name,
        userId: ctx.session.user.id,
      });
    }),

  update: baseOwnerProcedure
    .input(updateBaseSchema)
    .mutation(async ({ ctx, input }) => {
      return await baseService.updateBase({
        id: input.baseId,
        name: input.name,
        userId: ctx.session.user.id,
      });
    }),

  delete: baseOwnerProcedure
    .input(deleteBaseSchema)
    .mutation(async ({ ctx, input }) => {
      await baseService.deleteBase({
        id: input.baseId,
        userId: ctx.session.user.id,
      });
      
      return { success: true };
    }),
});