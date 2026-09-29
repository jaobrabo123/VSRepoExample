import { Module } from "@nestjs/common";
import { ConfigType } from "@nestjs/config";
import { DB_PROVIDER } from "./constants/db-provider.constant.js";
import appConfig from "../../config/app.config.js";
import { relations } from "./relations.js";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";

@Module({
    providers: [
        {
            provide: DB_PROVIDER,
            inject: [appConfig.KEY],
            useFactory: (config: ConfigType<typeof appConfig>) => {
                const client = createClient({ url: config.database.url });
                const db = drizzle({ client, relations });
                return db;
            },
        },
    ],
    exports: [DB_PROVIDER],
})
export class DrizzleModule {}
