import { db } from "~/server/db";

export interface MetadataRepository {
  getAllColumnTypes(): Promise<ColumnType[]>;
}

export interface ColumnType {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
}

export class PrismaMetadataRepository implements MetadataRepository {
  async getAllColumnTypes(): Promise<ColumnType[]> {
    const columnTypes = await db.columnType.findMany({
      select: {
        id: true,
        name: true,
        displayName: true,
        description: true,
      },
      orderBy: {
        displayName: 'asc',
      },
    });

    return columnTypes;
  }
}

// Export a singleton instance
export const metadataRepository = new PrismaMetadataRepository();