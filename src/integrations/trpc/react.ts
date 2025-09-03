import { createTRPCReact } from "@trpc/react-query";
import type { TRPCRouter } from "@/integrations/trpc/router";

export const trpc = createTRPCReact<TRPCRouter>();
