import { TRPCError } from "@trpc/server";
import {
  type ViewRepository,
  type View,
  type PaginatedViewData,
  type ViewMetadata,
  viewRepository,
} from "~/server/repositories/view.repository";

export interface ViewService {
  listViewsByTableId(tableId: string): Promise<View[]>;
  getViewRowsPaginated(viewId: string, cursor?: string, limit?: number): Promise<PaginatedViewData>;
  getViewMetadata(viewId: string): Promise<ViewMetadata>;
  addHiddenColumn(viewId: string, columnId: string): Promise<void>;
  removeHiddenColumn(viewId: string, columnId: string): Promise<void>;
  getHiddenColumns(viewId: string): Promise<string[]>;
}

export class ViewServiceImpl implements ViewService {
  constructor(
    private readonly viewRepository: ViewRepository
  ) {}

  async listViewsByTableId(tableId: string): Promise<View[]> {
    try {
      return await this.viewRepository.findByTableId(tableId);
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get views for table",
        cause: error,
      });
    }
  }

  async getViewRowsPaginated(viewId: string, cursor?: string, limit?: number): Promise<PaginatedViewData> {
    try {
      return await this.viewRepository.getViewRowsPaginated(viewId, cursor, limit);
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get paginated table rows",
        cause: error,
      });
    }
  }

  async getViewMetadata(viewId: string): Promise<ViewMetadata> {
    try {
      const viewMetadata = await this.viewRepository.getViewMetadata(viewId);
      
      if (!viewMetadata) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "View metadata not found",
        });
      }
      
      return viewMetadata;
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get table metadata",
        cause: error,
      });
    }
  }

  async addHiddenColumn(viewId: string, columnId: string): Promise<void> {
    try {
      await this.viewRepository.addHiddenColumn(viewId, columnId);
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to add hidden column",
        cause: error,
      });
    }
  }

  async removeHiddenColumn(viewId: string, columnId: string): Promise<void> {
    try {
      await this.viewRepository.removeHiddenColumn(viewId, columnId);
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to remove hidden column",
        cause: error,
      });
    }
  }

  async getHiddenColumns(viewId: string): Promise<string[]> {
    try {
      return await this.viewRepository.getHiddenColumns(viewId);
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get hidden columns",
        cause: error,
      });
    }
  }
}

export const viewService = new ViewServiceImpl(viewRepository);