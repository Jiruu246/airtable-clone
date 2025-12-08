import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { baseRouter } from "~/server/api/routers/base.router";
import { tableRouter } from "~/server/api/routers/table.router";
import { viewRouter } from "~/server/api/routers/view.router";
import { cellRouter } from "~/server/api/routers/cell.router";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  base: baseRouter,
  table: tableRouter,
  view: viewRouter,
  cell: cellRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
