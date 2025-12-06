import { TRPCError } from "@trpc/server";
import {
  type MetadataRepository,
  type ColumnType,
  metadataRepository,
} from "~/server/repositories/metadata.repository";

export interface MetadataService {
  getAllColumnTypes(): Promise<ColumnType[]>;
}

export class MetadataServiceImpl implements MetadataService {
  constructor(private readonly repository: MetadataRepository) {}

  async getAllColumnTypes(): Promise<ColumnType[]> {
    try {
      return await this.repository.getAllColumnTypes();
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch column types",
        cause: error,
      });
    }
  }
}

export const metadataService = new MetadataServiceImpl(metadataRepository);