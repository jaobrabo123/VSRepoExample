import { Injectable } from "@nestjs/common";
import { DynamicMethod, MethodOptions, VSLogLevel, VSRepository } from "vsrepo";
import { User } from "./entities/user.entity.js";
import { MyOrmTypes } from "../../common/types/my-orm-types.type.js";
import { InjectDb } from "../../infra/drizzle/constants/db-provider.constant.js";
import type { DB } from "../../infra/drizzle/types/db.type.js";
import { DrizzleAdapter } from "@vsrepo/drizzle-adapter";
import { user } from "../../infra/drizzle/schema.js";
import { relations } from "../../infra/drizzle/relations.js";

@Injectable()
export class UserRepository extends VSRepository<User, string, MyOrmTypes> {
    constructor(@InjectDb() db: DB) {
        super({
            adapter: new DrizzleAdapter(db, {
                queryKey: "user",
                table: user,
                logLevel: VSLogLevel.WARN,
                relationsSchema: relations,
            }),
            pkName: "id",
            logLevel: VSLogLevel.WARN,
            softRemoveKey: "removedAt",
        });
    }

    @DynamicMethod()
    declare existsByEmail: (email: string, options?: MethodOptions<User>) => Promise<boolean>;

    @DynamicMethod()
    declare findByNameStartsWith: (name?: string, options?: MethodOptions<User>) => Promise<User[]>;
}
