import { z } from "zod";
import { createTRPCRouter, tableOwnerProcedure, viewOwnerProcedure } from "~/server/api/trpc";
import { viewService } from "~/server/services/view.service";
import { FilterOperatorZodEnum, LogicalOperatorZodEnum, OrderingTypeZodEnum } from "../schema/schema";
import { LogicalOperators } from "~/data/logicalOperators";

const getViewRowsPaginatedSchema = z.object({
  viewId: z.string().uuid("Invalid view ID"),
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(1000).default(50),
  searchString: z.string().optional(),
});

const getViewMetadataSchema = z.object({
  viewId: z.string().uuid("Invalid view ID"),
});

const listViewsByTableSchema = z.object({
  tableId: z.string().uuid("Invalid table ID"),
});

const getViewByIdSchema = z.object({
  viewId: z.string().uuid("Invalid view ID"),
});

const createViewSchema = z.object({
  name: z.string().min(1, "View name is required").max(100, "View name must be 100 characters or less"),
  tableId: z.string().uuid("Invalid table ID"),
});

const updateViewSchema = z.object({
  viewId: z.string().uuid("Invalid view ID"),
  name: z.string().min(1, "View name is required").max(100, "View name must be 100 characters or less"),
});

const deleteViewSchema = z.object({
  viewId: z.string().uuid("Invalid view ID"),
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
  listViewsByTableId: tableOwnerProcedure
    .input(listViewsByTableSchema)
    .query(async ({ input }) => {
      return await viewService.listViewsByTableId(input.tableId);
    }),

  getById: viewOwnerProcedure
    .input(getViewByIdSchema)
    .query(async ({ input }) => {
      return await viewService.getViewById(input.viewId);
    }),

  create: tableOwnerProcedure
    .input(createViewSchema)
    .mutation(async ({ input }) => {
      return await viewService.createView({
        name: input.name,
        tableId: input.tableId,
      });
    }),

  update: viewOwnerProcedure
    .input(updateViewSchema)
    .mutation(async ({ input }) => {
      return await viewService.updateView(input.viewId, {
        name: input.name,
      });
    }),

  delete: viewOwnerProcedure
    .input(deleteViewSchema)
    .mutation(async ({ input }) => {
      await viewService.deleteView(input.viewId);
      return { success: true };
    }),

  getViewRowsPaginated: viewOwnerProcedure
    .input(getViewRowsPaginatedSchema)
    .query(async ({ input }) => {
      return await viewService.getViewRowsPaginated(input.viewId, input.cursor, input.limit, input.searchString);
    }),

  getViewMetadata: viewOwnerProcedure
    .input(getViewMetadataSchema)
    .query(async ({ input }) => {
      return await viewService.getViewMetadata(input.viewId);
    }),

  addHiddenColumn: viewOwnerProcedure
    .input(addHiddenColumnSchema)
    .mutation(async ({ input }) => {
      await viewService.addHiddenColumn(input.viewId, input.columnId);
      return { success: true };
    }),

  removeHiddenColumn: viewOwnerProcedure
    .input(removeHiddenColumnSchema)
    .mutation(async ({ input }) => {
      await viewService.removeHiddenColumn(input.viewId, input.columnId);
      return { success: true };
    }),

  getHiddenColumns: viewOwnerProcedure
    .input(getHiddenColumnsSchema)
    .query(async ({ input }) => {
      return await viewService.getHiddenColumns(input.viewId);
    }),

  getViewFilters: viewOwnerProcedure
    .input(getViewFiltersSchema)
    .query(async ({ input }) => {
      return await viewService.getViewFilters(input.viewId);
    }),

  addViewFilterCondition: viewOwnerProcedure
    .input(addViewFilterConditionSchema)
    .mutation(async ({ input }) => {
      await viewService.addViewFilterCondition(input.viewId, input.condition, input.operator);
      return { success: true };
    }),

  removeViewFilterCondition: viewOwnerProcedure
    .input(removeViewFilterConditionSchema)
    .mutation(async ({ input }) => {
      await viewService.removeViewFilterCondition(input.viewId, input.conditionIndex);
      return { success: true };
    }),

  updateViewFilterCondition: viewOwnerProcedure
    .input(updateViewFilterConditionSchema)
    .mutation(async ({ input }) => {
      await viewService.updateViewFilterCondition(input.viewId, input.conditionIndex, input.condition);
      return { success: true };
    }),

  updateViewFilterOperator: viewOwnerProcedure
    .input(updateViewFilterOperatorSchema)
    .mutation(async ({ input }) => {
      await viewService.updateViewFilterOperator(input.viewId, input.operator);
      return { success: true };
    }),

  getViewOrdering: viewOwnerProcedure
    .input(getViewOrderingSchema)
    .query(async ({ input }) => {
      return await viewService.getViewOrdering(input.viewId);
    }),

  addViewOrderingCondition: viewOwnerProcedure
    .input(addViewOrderingConditionSchema)
    .mutation(async ({ input }) => {
      await viewService.addViewOrderingCondition(input.viewId, input.condition);
      return { success: true };
    }),

  removeViewOrderingCondition: viewOwnerProcedure
    .input(removeViewOrderingConditionSchema)
    .mutation(async ({ input }) => {
      await viewService.removeViewOrderingCondition(input.viewId, input.conditionIndex);
      return { success: true };
    }),

  updateViewOrderingCondition: viewOwnerProcedure
    .input(updateViewOrderingConditionSchema)
    .mutation(async ({ input }) => {
      await viewService.updateViewOrderingCondition(input.viewId, input.conditionIndex, input.condition);
      return { success: true };
    }),
});