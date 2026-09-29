import { DynamicMethod, MethodOptions, VSLogLevel, VSRepository } from "vsrepo";
import { Post } from "./entities/post.entity.js";
import { MyOrmTypes } from "../../common/types/my-orm-types.type.js";
import { Injectable } from "@nestjs/common";
import { InjectDb } from "../../infra/drizzle/constants/db-provider.constant.js";
import type { DB } from "../../infra/drizzle/types/db.type.js";
import { DrizzleAdapter } from "@vsrepo/drizzle-adapter";
import { post } from "../../infra/drizzle/schema.js";
import { relations } from "../../infra/drizzle/relations.js";

@Injectable()
export class PostRepository extends VSRepository<Post, string, MyOrmTypes> {
    constructor(@InjectDb() db: DB) {
        super({
            adapter: new DrizzleAdapter(db, {
                queryKey: "post",
                table: post,
                relationsSchema: relations,
                logLevel: VSLogLevel.WARN,
                relations: { tags: { restriction: "set" } },
            }),
            pkName: "id",
            logLevel: VSLogLevel.WARN,
        });
    }

    @DynamicMethod()
    declare findByUserIdAndTitleContains: (
        userId?: string,
        title?: string,
        options?: MethodOptions<Post>,
    ) => Promise<Post[]>;
}
