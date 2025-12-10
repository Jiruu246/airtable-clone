import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { viewService } from "~/server/services/view.service";
import { FilterOperatorZodEnum, LogicalOperatorZodEnum, OrderingTypeZodEnum } from "../schema/schema";
import { LogicalOperators } from "~/data/logicalOperators";

const getViewRowsPaginatedSchema = z.object({
  id: z.string().uuid("Invalid view ID"),
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(1000).default(50),
  searchString: z.string().optional(),
});

const getViewMetadataSchema = z.object({
  id: z.string().uuid("Invalid view ID"),
});

const listViewsByTableSchema = z.object({
  tableId: z.string().uuid("Invalid table ID"),
});

const addHiddenColumnSchema = z.object({
  viewId: z.string().uuid("Invalid view ID"),
  columnId : z.string().uuid("Invalid column ID"),
});

const removeHiddenColumnSchema = z.object({
  viewId: z.string().uuid("Invalid view ID"),
  columnId: z.string().uuid("Invalid column ID"),
});

const getHiddenColumnsSchema = z.object({
  viewId: z.string().uuid("Invalid view ID"),
});

const viewFilterConditionSchema = z.object({
  column_id: z.string().uuid("Invalid column ID"),
  operator: FilterOperatorZodEnum,
  value: z.string().nullable(),
});

const getViewFiltersSchema = z.object({
  viewId: z.string().uuid("Invalid view ID"),
});

const addViewFilterConditionSchema = z.object({
  viewId: z.string().uuid("Invalid view ID"),
  condition: viewFilterConditionSchema,
  operator: LogicalOperatorZodEnum.optional().default(LogicalOperators.AND.value),
});

const removeViewFilterConditionSchema = z.object({
  viewId: z.string().uuid("Invalid view ID"),
  conditionIndex: z.number().int().min(0),
});

const updateViewFilterConditionSchema = z.object({
  viewId: z.string().uuid("Invalid view ID"),
  conditionIndex: z.number().int().min(0),
  condition: viewFilterConditionSchema,
});

const updateViewFilterOperatorSchema = z.object({
  viewId: z.string().uuid("Invalid view ID"),
  operator: LogicalOperatorZodEnum,
});

const viewOrderingConditionSchema = z.object({
  column_id: z.string().uuid("Invalid column ID"),
  direction: OrderingTypeZodEnum,
});

const getViewOrderingSchema = z.object({
  viewId: z.string().uuid("Invalid view ID"),
});

const addViewOrderingConditionSchema = z.object({
  viewId: z.string().uuid("Invalid view ID"),
  condition: viewOrderingConditionSchema,
});

const removeViewOrderingConditionSchema = z.object({
  viewId: z.string().uuid("Invalid view ID"),
  conditionIndex: z.number().int().min(0),
});

const updateViewOrderingConditionSchema = z.object({
  viewId: z.string().uuid("Invalid view ID"),
  conditionIndex: z.number().int().min(0),
  condition: viewOrderingConditionSchema,
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
      return await viewService.getViewRowsPaginated(input.id, input.cursor, input.limit, input.searchString);
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

  getViewFilters: protectedProcedure
    .input(getViewFiltersSchema)
    .query(async ({ input }) => {
      return await viewService.getViewFilters(input.viewId);
    }),

  addViewFilterCondition: protectedProcedure
    .input(addViewFilterConditionSchema)
    .mutation(async ({ input }) => {
      await viewService.addViewFilterCondition(input.viewId, input.condition, input.operator);
      return { success: true };
    }),

  removeViewFilterCondition: protectedProcedure
    .input(removeViewFilterConditionSchema)
    .mutation(async ({ input }) => {
      await viewService.removeViewFilterCondition(input.viewId, input.conditionIndex);
      return { success: true };
    }),

  updateViewFilterCondition: protectedProcedure
    .input(updateViewFilterConditionSchema)
    .mutation(async ({ input }) => {
      await viewService.updateViewFilterCondition(input.viewId, input.conditionIndex, input.condition);
      return { success: true };
    }),

  updateViewFilterOperator: protectedProcedure
    .input(updateViewFilterOperatorSchema)
    .mutation(async ({ input }) => {
      await viewService.updateViewFilterOperator(input.viewId, input.operator);
      return { success: true };
    }),

  getViewOrdering: protectedProcedure
    .input(getViewOrderingSchema)
    .query(async ({ input }) => {
      return await viewService.getViewOrdering(input.viewId);
    }),

  addViewOrderingCondition: protectedProcedure
    .input(addViewOrderingConditionSchema)
    .mutation(async ({ input }) => {
      await viewService.addViewOrderingCondition(input.viewId, input.condition);
      return { success: true };
    }),

  removeViewOrderingCondition: protectedProcedure
    .input(removeViewOrderingConditionSchema)
    .mutation(async ({ input }) => {
      await viewService.removeViewOrderingCondition(input.viewId, input.conditionIndex);
      return { success: true };
    }),

  updateViewOrderingCondition: protectedProcedure
    .input(updateViewOrderingConditionSchema)
    .mutation(async ({ input }) => {
      await viewService.updateViewOrderingCondition(input.viewId, input.conditionIndex, input.condition);
      return { success: true };
    }),
});