import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
    out: "./drizzle",
    dialect: "sqlite",
    schema: "./src/infra/drizzle/schema.ts",
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
    migrations: {
        schema: "public",
    },
});
