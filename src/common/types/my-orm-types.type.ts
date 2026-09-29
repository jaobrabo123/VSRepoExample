import { DrizzleOrmTypes } from "@vsrepo/drizzle-adapter";
import { DB } from "../../infra/drizzle/types/db.type.js";

export type MyOrmTypes = DrizzleOrmTypes<DB>;
