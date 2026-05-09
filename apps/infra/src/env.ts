import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    AWS_ACCOUNT_ID: z.string(),
    AWS_REGION: z.string(),
    MINECRAFT_EULA: z.literal("TRUE"),
  },
  experimental__runtimeEnv: {},
  skipValidation:
    !!process.env.CI || process.env.npm_lifecycle_event === "lint",
});
