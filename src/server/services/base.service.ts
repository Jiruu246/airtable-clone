import { TRPCError } from "@trpc/server";
import {
  type BaseRepository,
  type Base,
  type CreateBaseData,
  type UpdateBaseData,
  baseRepository,
} from "~/server/repositories/base.repository";
import { tableService } from "~/server/services/table.service";
import { SampleDataGenerator } from "~/server/utils/sample-data";

export interface BaseService {
  listUserBases(userId: string): Promise<Base[]>;
  getById(id: string, userId: string): Promise<Base>;
  createBase(data: CreateBaseInput): Promise<Base>;
  updateBase(data: UpdateBaseInput): Promise<Base>;
  deleteBase(data: DeleteBaseInput): Promise<void>;
}

export interface CreateBaseInput {
  name: string;
  userId: string;
}

export interface UpdateBaseInput {
  id: string;
  name: string;
  userId: string;
}

export interface DeleteBaseInput {
  id: string;
  userId: string;
}

export class BaseServiceImpl implements BaseService {
  constructor(private readonly repository: BaseRepository) {}

  async listUserBases(userId: string): Promise<Base[]> {
    return await this.repository.findByUserId(userId);
  }

  async getById(id: string, userId: string): Promise<Base> {
    const base = await this.repository.findByIdAndUserId(id, userId);
    
    if (!base) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Base not found or you don't have permission to access it",
      });
    }
    
    return base;
  }

  async createBase(data: CreateBaseInput): Promise<Base> {
    const createData: CreateBaseData = {
      name: data.name.trim(),
      userId: data.userId,
    };

    try {
      // Create the base
      const base = await this.repository.create(createData);
      
      // Generate sample table data using Faker.js
      const columns = [
        { name: "Name", type: "text", orderIndex: 0 },
        { name: "Score", type: "number", orderIndex: 1 },
      ];
      const numberOfRows = 100;
      const rows = SampleDataGenerator.generateRowsForColumns(columns, numberOfRows);
          
      // Create a table with sample data
      await tableService.createTableWithSampleData({
        name: "Sample Table",
        baseId: base.id,
        columns,
        rows,
      });

      return base;
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create base",
        cause: error,
      });
    }
  }

  async updateBase(data: UpdateBaseInput): Promise<Base> {
    const existingBase = await this.repository.findByIdAndUserId(
      data.id,
      data.userId
    );

    if (!existingBase) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Base not found or you don't have permission to update it",
      });
    }

    const updateData: UpdateBaseData = {
      name: data.name.trim(),
    };

    try {
      return await this.repository.update(data.id, updateData);
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to update base",
        cause: error,
      });
    }
  }

  async deleteBase(data: DeleteBaseInput): Promise<void> {
    const existingBase = await this.repository.findByIdAndUserId(
      data.id,
      data.userId
    );

    if (!existingBase) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Base not found or you don't have permission to delete it",
      });
    }

    try {
      await this.repository.delete(data.id);
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to delete base",
        cause: error,
      });
    }
  }
}

export const baseService = new BaseServiceImpl(baseRepository);