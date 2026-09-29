import { Inject } from "@nestjs/common";

export const DB_PROVIDER = "DB_PROVIDER";

export const InjectDb = () => Inject(DB_PROVIDER);
