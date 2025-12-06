import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { metadataService } from "~/server/services/metadata.service";

export const metadataRouter = createTRPCRouter({
  getColumnTypes: publicProcedure
    .query(async () => {
      return await metadataService.getAllColumnTypes();
    }),
});