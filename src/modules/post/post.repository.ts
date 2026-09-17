import { DynamicMethod, MethodOptions, VSLogLevel, VSRepository } from "vsrepo";
import { Post } from "./entities/post.entity.js";
import { MyOrmTypes } from "../../common/types/my-orm-types.type.js";
import { Prisma7Adapter } from "@vsrepo/prisma7-adapter";
import { PrismaService } from "../../infra/prisma/prisma.service.js";
import { Injectable } from "@nestjs/common";

@Injectable()
export class PostRepository extends VSRepository<Post, string, MyOrmTypes> {
    constructor(prisma: PrismaService) {
        super({
            adapter: new Prisma7Adapter(prisma, {
                pkName: "id",
                tableName: "post",
                logLevel: VSLogLevel.DEBUG,
                relations: { tags: { mode: "otm", pk: "id", restriction: "set" } },
            }),
            pkName: "id",
            logLevel: VSLogLevel.DEBUG,
        });
    }

    @DynamicMethod()
    declare findByUserIdAndTitleContains: (
        userId?: string,
        title?: string,
        options?: MethodOptions<Post>,
    ) => Promise<Post[]>;
}
