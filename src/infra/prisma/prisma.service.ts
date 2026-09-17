import { Inject, Injectable } from "@nestjs/common";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import appConfig from "../../config/app.config.js";
import type { ConfigType } from "@nestjs/config";
import { PrismaClient } from "../../generated/prisma/client.js";

@Injectable()
export class PrismaService extends PrismaClient {
    constructor(@Inject(appConfig.KEY) config: ConfigType<typeof appConfig>) {
        const adapter = new PrismaBetterSqlite3({ url: config.database.url });
        super({ adapter });
    }
}
