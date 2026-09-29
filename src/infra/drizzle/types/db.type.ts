import type { LibSQLDatabase } from "drizzle-orm/libsql";
import type { Client } from "@libsql/client";
import { relations } from "../relations.js";

export type DB = LibSQLDatabase<typeof relations> & {
    $client: Client;
};
