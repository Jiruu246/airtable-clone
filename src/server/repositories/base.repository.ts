import { db } from "~/server/db";

export interface BaseRepository {
  findByUserId(userId: string): Promise<Base[]>;
  findById(id: string): Promise<Base | null>;
  findByIdAndUserId(id: string, userId: string): Promise<Base | null>;
  create(data: CreateBaseData): Promise<Base>;
  update(id: string, data: UpdateBaseData): Promise<Base>;
  delete(id: string): Promise<void>;
}

export interface Base {
  id: string;
  name: string;
  userId: string;
}

export interface CreateBaseData {
  name: string;
  userId: string;
}

export interface UpdateBaseData {
  name?: string;
}

export class PrismaBaseRepository implements BaseRepository {
  async findByUserId(userId: string): Promise<Base[]> {
    return await db.base.findMany({
      where: {
        userId,
      },
      select: {
        id: true,
        name: true,
        userId: true,
      },
      orderBy: {
        name: "asc",
      },
    });
  }

  async findById(id: string): Promise<Base | null> {
    return await db.base.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        name: true,
        userId: true,
      },
    });
  }

  async findByIdAndUserId(id: string, userId: string): Promise<Base | null> {
    return await db.base.findFirst({
      where: {
        id,
        userId,
      },
      select: {
        id: true,
        name: true,
        userId: true,
      },
    });
  }

  async create(data: CreateBaseData): Promise<Base> {
    return await db.base.create({
      data,
      select: {
        id: true,
        name: true,
        userId: true,
      },
    });
  }

  async update(id: string, data: UpdateBaseData): Promise<Base> {
    return await db.base.update({
      where: {
        id,
      },
      data,
      select: {
        id: true,
        name: true,
        userId: true,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await db.base.delete({
      where: {
        id,
      },
    });
  }
}

// Export a singleton instance
export const baseRepository = new PrismaBaseRepository();