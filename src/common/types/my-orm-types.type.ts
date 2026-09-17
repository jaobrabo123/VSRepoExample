import { Prisma7OrmTypes } from "@vsrepo/prisma7-adapter";
import { PrismaClient } from "../../generated/prisma/client.js";

export type MyOrmTypes = Prisma7OrmTypes<PrismaClient>;
